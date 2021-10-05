import { loadConfig } from './configure';

import client from './client';

import chalk from 'chalk';

import { execSync } from 'child_process';

import debugging from 'debug';
import {
    Epic,
    File,
    Iteration,
    Label,
    Member,
    Project,
    Story,
    Workflow,
    WorkflowState,
} from 'clubhouse-lib';

const debug = debugging('club');
const config = loadConfig();
const log = console.log;

export interface Entities {
    projectsById?: { [key: string]: Project };
    statesById?: { [key: string]: WorkflowState };
    membersById?: { [key: string]: Member };
    epicsById?: { [key: string]: Epic };
    iterationsById?: { [key: string]: Iteration };
    labels?: Label[];
}

/**
 * Augmented story to be displayed
 */
export interface StoryHydrated extends Story {
    epic?: Epic;
    iteration?: Iteration;
    project?: Project;
    state?: WorkflowState;
    owners?: Member[];
}

async function fetchEntities(): Promise<Entities> {
    let [
        projectsById,
        statesById,
        membersById,
        epicsById,
        iterationsById,
        labels,
    ] = await Promise.all([
        client.listProjects().then(mapByItemId),
        client
            .listWorkflows()
            .then((wfs: Workflow[]) => wfs.reduce((states, wf) => states.concat(wf.states), []))
            .then(mapByItemId),
        client.listMembers().then(mapByItemId),
        client.listEpics().then(mapByItemId),
        client.listIterations().then(mapByItemId),
        client.listLabels(),
    ]).catch((err) => {
        log(`Error fetching workflows: ${err}`);
        process.exit(2);
    });

    debug('response workflows, members, projects, epics, iterations');
    return { projectsById, statesById, membersById, epicsById, iterationsById, labels };
}

const listStories = async (program: any) => {
    debug('request workflows, members, projects, epics');
    const entities = await fetchEntities();

    const stories = await fetchStories(program, entities);

    debug('filtering stories');
    return filterStories(program, stories, entities).sort(sortStories(program));
};

// TODO: Use proper generics
const mapByItemId = (items: any[]) =>
    items.reduce((obj, item) => ({ ...obj, [item.id]: item }), {});

const fetchStories = async (program: any, entities: Entities) => {
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
    return Promise.all(projectIds.map((p) => client.listStories(p.id))).then((projectStories) =>
        projectStories.reduce((acc, stories) => acc.concat(stories), [])
    );
};

const searchStories = async (program: any) => {
    const query = program.args.join(' ').replace('%self%', config.mentionName);
    let result = await client.searchStories(query);
    let stories = result.data;
    while (result.next) {
        result = await client.getResource(result.next);
        stories = stories.concat(result.data);
    }
    return stories;
};

const hydrateStory: (entities: Entities, story: Story) => StoryHydrated = (
    entities: Entities,
    story: Story
) => {
    debug('hydrating story');
    const augmented = story as StoryHydrated;
    augmented.project = entities.projectsById[story.project_id];
    augmented.state = entities.statesById[story.workflow_state_id];
    augmented.epic = entities.epicsById[story.epic_id];
    augmented.iteration = entities.iterationsById[story.iteration_id];
    augmented.owners = story.owner_ids.map((id) => entities.membersById[id]);
    debug('hydrated story');
    return augmented;
};

const findProject = (entities: Entities, project: number | string) => {
    if (entities.projectsById[project]) {
        return entities.projectsById[project];
    }
    const projectMatch = new RegExp(`${project}`, 'i');
    return Object.values(entities.projectsById).filter((s) => !!s.name.match(projectMatch))[0];
};

const findState = (entities: Entities, state: string | number) => {
    if (entities.statesById[state]) {
        return entities.statesById[state];
    }
    const stateMatch = new RegExp(`${state}`, 'i');
    // Since the name of a state may be duplicated, it would be
    // much safer to search for states of the current story workflow.
    // That will take a bit of refactoring.
    return Object.values(entities.statesById).filter((s) => !!s.name.match(stateMatch))[0];
};

const findEpic = (entities: Entities, epicName: string | number) => {
    if (entities.epicsById[epicName]) {
        return entities.epicsById[epicName];
    }
    const epicMatch = new RegExp(`${epicName}`, 'i');
    return Object.values(entities.epicsById).filter((s) => s.name.match(epicMatch))[0];
};

const findIteration = (entities: Entities, iterationName: string | number) => {
    if (entities.iterationsById[iterationName]) {
        return entities.iterationsById[iterationName];
    }
    const iterationMatch = new RegExp(`${iterationName}`, 'i');
    return Object.values(entities.iterationsById).filter((s) => s.name.match(iterationMatch))[0];
};

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
    \tProject:    %p
    \tEpic:       %epic
    \tIteration:  %i
    \tOwners:     %o
    \tState:      %s
    \tLabels:     %l
    \tURL:        %u
    \tCreated:    %c\tUpdated: %updated
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
                .replace(/%o/, owners.join(', ') || '_')
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
        return `${o.profile.name} (` + chalk.bold(`${o.profile.mention_name}` + ')');
    });

    log(chalk.blue.bold(`#${story.id}`) + chalk.blue(` ${story.name}`));
    log(chalk.bold('Desc:') + `      ${formatLong(story.description || '_')}`);
    log(chalk.bold('Owners:') + `    ${owners.join(', ') || '_'}`);
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
        const author = entities.membersById[c.author_id];
        log(chalk.bold('Comment:') + `  ${formatLong(c.text)}`);
        log(`          ${author.profile.name} ` + chalk.bold('at:') + ` ${c.updated_at}`);
        return c;
    });
    story.files.map((c) => {
        log(chalk.bold('File:') + `     ${fileURL(c)}`);
        log(chalk.bold('          name:') + `  ${c.name}`);
        return c;
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

// @ts-ignore
const fileURL = (file: File) => `${file.url}?token=${client.requestFactory.token}`;

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
