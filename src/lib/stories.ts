import { loadConfig } from './configure';

import client from './client';

import chalk from 'chalk';

import { execSync } from 'child_process';

import debugging from 'debug';
import {
    Epic,
    EpicSlim,
    Group,
    Iteration,
    IterationSlim,
    Label,
    Member,
    Project,
    Story,
    UploadedFile,
    Workflow,
    WorkflowState,
} from '@useshortcut/client';

const debug = debugging('club');
const config = loadConfig();
const log = console.log;

interface HasId {
    id: number | string;
}

export interface Entities {
    projectsById?: Map<number, Project>;
    statesById?: Map<number, WorkflowState>;
    membersById?: Map<string, Member>;
    groupsById?: Map<string, Group>;
    epicsById?: Map<number, EpicSlim>;
    iterationsById?: Map<number, IterationSlim>;
    labels?: Label[];
}

/**
 * Augmented story to be displayed
 */
export interface StoryHydrated extends Story {
    epic?: EpicSlim;
    iteration?: IterationSlim;
    project?: Project;
    state?: WorkflowState;
    group?: Group;
    owners?: Member[];
    requester?: Member;
}

async function fetchEntities(): Promise<Entities> {
    let [
        projectsById,
        statesById,
        membersById,
        groupsById,
        epicsById,
        iterationsById,
        labels,
    ] = await Promise.all([
        client
            .listProjects()
            .then((r) => r.data)
            .then(mapByItemId),
        client
            .listWorkflows()
            .then((r) => r.data)
            .then((wfs: Workflow[]) => wfs.reduce((states, wf) => states.concat(wf.states), []))
            .then(mapByItemId),
        client
            .listMembers(null)
            .then((r) => r.data)
            .then(mapByItemStringId),
        client
            .listGroups()
            .then((r) => r.data)
            .then(mapByItemStringId),
        client
            .listEpics(null)
            .then((r) => r.data)
            .then(mapByItemId),
        client
            .listIterations(null)
            .then((r) => r.data)
            .then(mapByItemId),
        client.listLabels(null).then((r) => r.data),
    ]).catch((err) => {
        log(`Error fetching workflows: ${err}`);
        process.exit(2);
    });

    debug('response workflows, members, groups, projects, epics, iterations');
    return { projectsById, statesById, membersById, groupsById, epicsById, iterationsById, labels };
}

const listStories = async (program: any) => {
    debug('request workflows, members, projects, epics');
    const entities = await fetchEntities();

    const stories = await fetchStories(program, entities);

    debug('filtering stories');
    return filterStories(program, stories, entities).sort(sortStories(program));
};

function mapByItemId<T extends HasId>(items: T[]): Map<number, T> {
    return items.reduce((map, obj) => map.set(obj.id, obj), new Map());
}

function mapByItemStringId<T extends HasId>(items: T[]): Map<string, T> {
    return items.reduce((map, obj) => map.set(obj.id, obj), new Map());
}

async function fetchStories(program: any, entities: Entities): Promise<Story[]> {
    if ((program.args || []).length) {
        debug('using the search endpoint');
        return searchStories(program);
    }

    debug('filtering projects');
    let regexProject = new RegExp(program.project, 'i');
    const projectIds = Object.values(entities.projectsById).filter(
        (p) => !!(p.id + p.name).match(regexProject)
    );

    debug('request all stories for project(s)', projectIds.map((p) => p.name).join(', '));
    return Promise.all(
        projectIds.map((p) => client.listStories(p.id, null))
    ).then((projectStories) => projectStories.reduce((acc, stories) => acc.concat(stories), []));
}

async function searchStories(program: any): Promise<Story[]> {
    const query = program.args.join(' ').replace('%self%', config.mentionName);
    let result = await client.searchStories({ query });
    let stories: Story[] = result.data.data;
    while (result.data.next) {
        const nextCursor = new URLSearchParams(result.data.next).get('next');
        result = await client.searchStories({ query, next: nextCursor });
        stories = stories.concat(result.data.data);
    }
    return stories;
}

const hydrateStory: (entities: Entities, story: Story) => StoryHydrated = (
    entities: Entities,
    story: Story
) => {
    debug('hydrating story');
    const augmented = story as StoryHydrated;
    augmented.project = entities.projectsById.get(story.project_id);
    augmented.state = entities.statesById.get(story.workflow_state_id);
    augmented.epic = entities.epicsById.get(story.epic_id);
    augmented.iteration = entities.iterationsById.get(story.iteration_id);
    augmented.owners = story.owner_ids.map((id) => entities.membersById.get(id));
    augmented.requester = entities.membersById.get(story.requested_by_id);
    augmented.group = entities.groupsById.get(story.group_id);
    debug('hydrated story');
    return augmented;
};

const isNumber = (val: string | number) => !!(val || val === 0) && !isNaN(Number(val.toString()));

const findEntity = <_, V>(entities: Map<string | number, V>, id: string | number) => {
    // entities can be either a map of string ids or a map of number ids
    // id, when passed in, is often a string coming from user input
    // so we need to check both types to find the entity.
    if (entities.get(id)) {
        return entities.get(id);
    }
    if (isNumber(id) && Number(id.toString())) {
        return entities.get(Number(id.toString()));
    }
    const match = new RegExp(`${id}`, 'i');
    return Object.values(entities).filter((s) => !!s.name.match(match))[0];
};

const findProject = (entities: Entities, project: number) =>
    findEntity(entities.projectsById, project);

const findState = (entities: Entities, state: number) => findEntity(entities.statesById, state);

const findEpic = (entities: Entities, epicName: number) => findEntity(entities.epicsById, epicName);

const findIteration = (entities: Entities, iterationName: number) =>
    findEntity(entities.statesById, iterationName);

const findOwnerIds = (entities: Entities, owners: string) => {
    const ownerMatch = new RegExp(owners.split(',').join('|'), 'i');
    return Object.values(entities.membersById)
        .filter((m) => !!`${m.id} ${m.profile.name} ${m.profile.mention_name}`.match(ownerMatch))
        .map((m) => m.id);
};

const findLabelNames = (entities: Entities, label: string) => {
    const labelMatch = new RegExp(label.split(',').join('|'), 'i');
    return entities.labels
        .filter((m) => !!`${m.id} ${m.name}`.match(labelMatch))
        .map((m) => ({ name: m.name } as Label));
};

const filterStories = (program: any, stories: Story[], entities: Entities) => {
    let created_at: any;
    if (program.created) {
        created_at = parseDateComparator(program.created);
    }
    let updated_at: any;
    if (program.updated) {
        updated_at = parseDateComparator(program.updated);
    }
    let estimate: any;
    if (program.estimate) {
        estimate = parseNumberComparator(program.estimate);
    }
    let regexLabel = new RegExp(program.label, 'i');
    let regexState = new RegExp(program.state, 'i');
    let regexOwner = new RegExp(program.owner, 'i');
    let regexText = new RegExp(program.text, 'i');
    let regexType = new RegExp(program.type, 'i');
    let regexEpic = new RegExp(program.epic, 'i');
    let regexIteration = new RegExp(program.iteration, 'i');

    return stories
        .map((story: Story) => hydrateStory(entities, story))
        .filter((s) => {
            if (!program.archived && s.archived) {
                return false;
            }
            if (!(s.labels.map((l) => `${l.id},${l.name}`).join(',') + '').match(regexLabel)) {
                return false;
            }
            if (
                !(s.workflow_state_id + ' ' + (s.state || ({} as WorkflowState)).name).match(
                    regexState
                )
            ) {
                return false;
            }
            if (!(s.epic_id + ' ' + (s.epic || ({} as Epic)).name).match(regexEpic)) {
                return false;
            }
            if (
                !(s.iteration_id + ' ' + (s.iteration || ({} as Iteration)).name).match(
                    regexIteration
                )
            ) {
                return false;
            }
            if (program.owner) {
                const owned =
                    s.owners.filter((o) => {
                        return !!`${o.profile.name} ${o.profile.mention_name}`.match(regexOwner);
                    }).length > 0;
                if (!owned) return false;
            }
            if (!s.name.match(regexText)) {
                return false;
            }
            if (!s.story_type.match(regexType)) {
                return false;
            }
            if (created_at && !created_at(s.created_at)) {
                return false;
            }
            if (updated_at && !updated_at(s.updated_at)) {
                return false;
            }
            return !(estimate && !estimate(s.estimate));
        });
};

const sortStories = (program: any) => {
    const fields = (program.sort || '').split(',').map((s: string) => {
        return s.split(':').map((ss) => ss.split('.'));
    });
    const pluck = (acc: any, val: any) => {
        if (acc[val] === undefined) return {};
        return acc[val];
    };
    debug('sorting stories');
    return (a: Story, b: Story) => {
        return fields.reduce((acc: any, field: any) => {
            if (acc !== 0) return acc;
            const ap = field[0].reduce(pluck, a);
            const bp = field[0].reduce(pluck, b);
            if (ap === bp) return 0;
            const direction = (field[1] || [''])[0].match(/des/i) ? 1 : -1;
            if (ap > bp) {
                if (direction > 0) return -1;
            } else {
                if (direction < 0) return -1;
            }
            return 1;
        }, 0);
    };
};

const printFormattedStory = (program: any) => {
    return (story: StoryHydrated) => {
        const defaultFormat = `#%id %t
    \tType:       %y/%e
    \tTeam:       %T
    \tProject:    %p
    \tEpic:       %epic
    \tIteration:  %i
    \tRequester:  %r
    \tOwners:     %o
    \tState:      %s
    \tLabels:     %l
    \tURL:        %u
    \tCreated:    %c
    \tUpdated:    %updated
    \tArchived:   %a
    `;
        const format = program.format || defaultFormat;
        const labels = story.labels.map((l: Label) => `${l.name} (#${l.id})`);
        const owners = story.owners.map(
            (o: Member) => `${o.profile.name} (${o.profile.mention_name})`
        );
        const url = `https://app.shortcut.com/story/${story.id}`;
        const project = story.project ? `${story.project.name} (#${story.project.id})` : 'None';
        log(
            format
                .replace(/%j/, JSON.stringify({ ...story, url }, null, 2))
                .replace(/%id/, chalk.blue.bold(`${story.id}`))
                .replace(/%t/, chalk.blue(`${story.name}`))
                .replace(/%d/, story.description || '')
                .replace(/%y/, story.story_type)
                .replace(/%l/, labels.join(', ') || '_')
                .replace(
                    /%epic/,
                    story.epic_id ? `${(story.epic || ({} as Epic)).name} (#${story.epic_id})` : '_'
                )
                .replace(/%e/, `${story.estimate || '_'}`)
                .replace(
                    /%i/,
                    story.iteration_id
                        ? `${(story.iteration || ({} as Iteration)).name} (#${story.iteration_id})`
                        : '_'
                )
                .replace(/%p/, project)
                .replace(/%T/, story.group?.name || '_')
                .replace(/%o/, owners.join(', ') || '_')
                .replace(
                    /%r/,
                    `${story.requester.profile.name} (${story.requester.profile.mention_name})` ||
                        '_'
                )
                .replace(
                    /%s/,
                    `${(story.state || ({} as WorkflowState)).name} (#${story.workflow_state_id})`
                )
                .replace(/%c/, `${story.created_at}`)
                .replace(
                    /%updated/,
                    `${story.updated_at !== story.created_at ? story.updated_at : '_'}`
                )
                .replace(/%u/, url)
                .replace(/%a/, `${story.archived}`)
                .replace(
                    /%gbs/,
                    `${buildStoryBranch(story, `${config.mentionName}/sc-${story.id}/`)}`
                )
                .replace(/%gb/, `${buildStoryBranch(story)}`)
        );
        return story;
    };
};

const buildURL = (...segments: (string | number)[]): string => {
    return [
        'https://app.shortcut.com',
        config.urlSlug,
        ...segments.map((item) => item.toString()),
    ].join('/');
};

const storyURL = (story: Story) => buildURL('story', story.id);

const printDetailedStory = (story: StoryHydrated, entities: Entities = {}) => {
    const labels = story.labels.map((l) => {
        return chalk.bold(`#${l.id}`) + ` ${l.name}`;
    });
    const owners = story.owners.map((o) => {
        const mentionName = chalk.bold(`${o.profile.mention_name}`);
        return `${o.profile.name} (${mentionName})`;
    });

    log(chalk.blue.bold(`#${story.id}`) + chalk.blue(` ${story.name}`));
    log(chalk.bold('Desc:') + `      ${formatLong(story.description || '_')}`);
    log(chalk.bold('Team:') + `      ${story.group?.name || '_'}`);
    log(chalk.bold('Owners:') + `    ${owners.join(', ') || '_'}`);
    log(
        chalk.bold('Requester:') +
            ` ${story.requester.profile.name} (${story.requester.profile.mention_name})`
    );
    log(chalk.bold('Type:') + `      ${story.story_type}/${story.estimate || '_'}`);
    log(chalk.bold('Label:') + `     ${labels.join(', ') || '_'}`);
    if (story.project) {
        log(chalk.bold('Project:') + chalk.bold(`   #${story.project_id} `) + story.project.name);
    }
    if (story.epic) {
        log(chalk.bold('Epic:') + chalk.bold(`      #${story.epic_id} `) + story.epic.name);
    } else {
        log(chalk.bold('Epic:') + '      _');
    }
    if (story.iteration) {
        log(
            chalk.bold('Iteration:') + chalk.bold(` #${story.iteration_id} `) + story.iteration.name
        );
    } else {
        log(chalk.bold('Iteration:') + ' _');
    }
    log(chalk.bold('State:') + chalk.bold(`     #${story.workflow_state_id} `) + story.state.name);
    log(chalk.bold('Created:') + `   ${story.created_at}`);
    if (story.created_at !== story.updated_at) {
        log(chalk.bold('Updated:') + `   ${story.updated_at}`);
    }
    log(chalk.bold('URL:') + `       ${storyURL(story)}`);
    if (story.archived) {
        log(chalk.bold('Archived:  ') + chalk.bold(`${story.archived}`));
    }
    if (story.completed) {
        log(chalk.bold('Completed:  ') + chalk.bold(`${story.completed_at}`));
    }
    story.tasks.map((c) => {
        log(
            chalk.bold('Task:     ') +
                (c.complete ? '[X]' : '[ ]') +
                ' ' +
                formatLong(c.description)
        );
        return c;
    });
    story.comments.map((c) => {
        const author = entities.membersById.get(c.author_id);
        log(chalk.bold('Comment:') + `  ${formatLong(c.text)}`);
        log(`          ${author.profile.name} ` + chalk.bold('at:') + ` ${c.updated_at}`);
        return c;
    });
    story.files.map((file) => {
        log(chalk.bold('File:') + `     ${file.name}`);
        log(`          ${file.url}`);
        return file;
    });
    log();
};

const formatLong = (str: string) => str.split('\n').join('\n         ');

const parseDateComparator: (arg: string) => (date: string) => boolean = (arg) => {
    const match = arg.match(/[0-9].*/) || { index: 0, '0': { length: 30 } };
    const parsedDate = new Date(arg.slice(match.index));
    const comparator = arg.slice(0, match.index);
    return (date) => {
        switch (comparator) {
            case '<':
                return new Date(date) < parsedDate;
            case '>':
                return new Date(date) > parsedDate;
            case '=':
            default:
                return new Date(date.slice(0, match[0].length)).getTime() === parsedDate.getTime();
        }
    };
};

const parseNumberComparator: (arg: string) => (n: number) => boolean = (arg) => {
    const match = arg.match(/[0-9].*/) || { index: 0, '0': { length: 30 } };
    const parsedNumber = Number(arg.slice(match.index));
    const comparator = arg.slice(0, match.index).trimRight();
    return (n) => {
        switch (comparator) {
            case '<':
                return Number(n) < parsedNumber;
            case '>':
                return Number(n) > parsedNumber;
            case '=':
            default:
                return Number(n) === parsedNumber;
        }
    };
};

const buildStoryBranch = (story: StoryHydrated, prefix: string = '') => {
    prefix = prefix || `${config.mentionName}/sc-${story.id}/${story.story_type}-`;
    let slug = story.name
        .toLowerCase()
        .replace(/\W/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 30)
        .replace(/-$/, '');
    return `${prefix}${slug}`;
};

const checkoutStoryBranch = (story: StoryHydrated, prefix: string = '') => {
    const branch = buildStoryBranch(story, prefix);
    debug('checking out git branch: ' + branch);
    execSync(`git checkout ${branch} 2> /dev/null || git checkout -b ${branch}`);
};

const fileURL = (file: UploadedFile) => `${file.url}?token=${config.token}`;

export default {
    listStories,
    printFormattedStory,
    printDetailedStory,
    checkoutStoryBranch,
    fetchEntities,
    hydrateStory,
    findProject,
    findState,
    findEpic,
    findIteration,
    findOwnerIds,
    findLabelNames,
    fileURL,
    storyURL,
    buildURL,
};
