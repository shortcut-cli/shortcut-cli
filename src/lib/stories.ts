import { execSync } from 'child_process';

import chalk from 'chalk';
import debugging from 'debug';
import type {
    CreateLabelParams,
    EpicSlim,
    Group,
    IterationSlim,
    Label,
    Member,
    Project,
    Story,
    StorySearchResult,
    StorySlim,
    UploadedFile,
    Workflow,
    WorkflowState,
} from '@shortcut/client';

import client from './client';
import { loadConfig } from './configure';

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
 * Options for filtering and displaying stories
 */
export interface StoryListOptions {
    args?: string[];
    archived?: boolean;
    created?: string;
    updated?: string;
    estimate?: string;
    label?: string;
    state?: string;
    owner?: string;
    text?: string;
    type?: string;
    epic?: string;
    iteration?: string;
    project?: string;
    sort?: string;
    format?: string;
}

/**
 * Base story type that works with both Story and StorySlim
 */
export type StoryBase = Story | StorySlim;

/**
 * Augmented story to be displayed
 */
export interface StoryHydrated extends Story {
    epic?: EpicSlim;
    iteration?: IterationSlim;
    project?: Project;
    state?: WorkflowState;
    group?: Group;
    owners?: (Member | undefined)[];
    requester?: Member;
}

async function fetchEntities(): Promise<Entities> {
    const [projectsById, statesById, membersById, groupsById, epicsById, iterationsById, labels] =
        await Promise.all([
            client
                .listProjects()
                .then((r) => r.data)
                .then(mapByItemId),
            client
                .listWorkflows()
                .then((r) => r.data)
                .then((wfs: Workflow[]) =>
                    wfs.reduce<WorkflowState[]>((states, wf) => states.concat(wf.states), [])
                )
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

const listStories = async (options: StoryListOptions): Promise<StoryHydrated[]> => {
    debug('request workflows, members, projects, epics');
    const entities = await fetchEntities();

    const stories = await fetchStories(options, entities);

    debug('filtering stories');
    return filterStories(options, stories, entities).sort(sortStories(options));
};

function mapByItemId<T extends HasId>(items: T[]): Map<number, T> {
    return items.reduce((map, obj) => map.set(obj.id, obj), new Map());
}

function mapByItemStringId<T extends HasId>(items: T[]): Map<string, T> {
    return items.reduce((map, obj) => map.set(obj.id, obj), new Map());
}

async function fetchStories(
    options: StoryListOptions,
    entities: Entities
): Promise<(Story | StorySlim)[]> {
    if ((options.args ?? []).length) {
        debug('using the search endpoint');
        return searchStories(options);
    }

    debug('filtering projects');
    const regexProject = new RegExp(options.project ?? '', 'i');
    const projects = entities.projectsById ? [...entities.projectsById.values()] : [];
    const projectIds = projects.filter((p) => !!(p.id + p.name).match(regexProject));

    debug('request all stories for project(s)', projectIds.map((p) => p.name).join(', '));
    return Promise.all(projectIds.map((p) => client.listStories(p.id, null))).then(
        (projectStories) =>
            projectStories.reduce<StorySlim[]>((acc, stories) => acc.concat(stories.data), [])
    );
}

async function searchStories(options: StoryListOptions): Promise<Story[]> {
    const query = (options.args ?? []).join(' ').replace('%self%', config.mentionName ?? '');
    let result = await client.searchStories({ query });
    let stories: Story[] = result.data.data.map(storySearchResultToStory);
    while (result.data.next) {
        const nextCursor = new URLSearchParams(result.data.next).get('next');
        result = await client.searchStories({ query, next: nextCursor });
        stories = stories.concat(result.data.data.map(storySearchResultToStory));
    }
    return stories;
}

const storySearchResultToStory = (storySearchResult: StorySearchResult): Story => {
    return {
        ...storySearchResult,
        description: storySearchResult.description || '',
        linked_files: storySearchResult.linked_files || [],
        comments: storySearchResult.comments || [],
        branches: storySearchResult.branches || [],
        tasks: storySearchResult.tasks || [],
        pull_requests: storySearchResult.pull_requests || [],
        commits: storySearchResult.commits || [],
        files: storySearchResult.files || [],
    };
};

const hydrateStory = (entities: Entities, story: StoryBase): StoryHydrated => {
    debug('hydrating story');
    const augmented = story as StoryHydrated;
    augmented.project = entities.projectsById?.get(story.project_id);
    augmented.state = entities.statesById?.get(story.workflow_state_id);
    augmented.epic = entities.epicsById?.get(story.epic_id);
    augmented.iteration = entities.iterationsById?.get(story.iteration_id);
    augmented.owners = story.owner_ids.map((id) => entities.membersById?.get(id));
    augmented.requester = entities.membersById?.get(story.requested_by_id);
    augmented.group = entities.groupsById?.get(story.group_id);
    debug('hydrated story');
    return augmented;
};

const isNumber = (val: string | number) => !!(val || val === 0) && !isNaN(Number(val.toString()));

const findEntity = <V extends { name: string }>(
    entities: Map<string | number, V> | undefined,
    id: string | number
): V | undefined => {
    if (!entities) return undefined;
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
    return Array.from(entities.values()).filter((s) => !!s.name.match(match))[0];
};

const findProject = (entities: Entities, project: string | number) =>
    findEntity(entities.projectsById, project);

const findGroup = (entities: Entities, group: string | number) =>
    findEntity(entities.groupsById, group);

const findState = (entities: Entities, state: string | number) =>
    findEntity(entities.statesById, state);

const findEpic = (entities: Entities, epicName: string | number) =>
    findEntity(entities.epicsById, epicName);

const findIteration = (entities: Entities, iterationName: string | number) =>
    findEntity(entities.iterationsById, iterationName);

const findOwnerIds = (entities: Entities, owners: string): string[] => {
    const ownerMatch = new RegExp(owners.split(',').join('|'), 'i');
    const members = entities.membersById ? Array.from(entities.membersById.values()) : [];
    return members
        .filter((m) => !!`${m.id} ${m.profile.name} ${m.profile.mention_name}`.match(ownerMatch))
        .map((m) => m.id);
};

const findLabelNames = (entities: Entities, label: string): CreateLabelParams[] => {
    const labelMatch = new RegExp(label.split(',').join('|'), 'i');
    return (entities.labels ?? [])
        .filter((m) => !!`${m.id} ${m.name}`.match(labelMatch))
        .map((m) => ({ name: m.name }));
};

const filterStories = (
    options: StoryListOptions,
    stories: StoryBase[],
    entities: Entities
): StoryHydrated[] => {
    type DateComparator = (date: string) => boolean;
    type NumberComparator = (n: number | null) => boolean;

    let createdAtFilter: DateComparator | undefined;
    if (options.created) {
        createdAtFilter = parseDateComparator(options.created);
    }
    let updatedAtFilter: DateComparator | undefined;
    if (options.updated) {
        updatedAtFilter = parseDateComparator(options.updated);
    }
    let estimateFilter: NumberComparator | undefined;
    if (options.estimate) {
        estimateFilter = parseNumberComparator(options.estimate);
    }
    const regexLabel = new RegExp(options.label ?? '', 'i');
    const regexState = new RegExp(options.state ?? '', 'i');
    const regexOwner = new RegExp(options.owner ?? '', 'i');
    const regexText = new RegExp(options.text ?? '', 'i');
    const regexType = new RegExp(options.type ?? '', 'i');
    const regexEpic = new RegExp(options.epic ?? '', 'i');
    const regexIteration = new RegExp(options.iteration ?? '', 'i');

    return stories
        .map((story) => hydrateStory(entities, story))
        .filter((s) => {
            if (!options.archived && s.archived) {
                return false;
            }
            if (!(s.labels.map((l) => `${l.id},${l.name}`).join(',') + '').match(regexLabel)) {
                return false;
            }
            if (!(s.workflow_state_id + ' ' + (s.state?.name ?? '')).match(regexState)) {
                return false;
            }
            if (!(s.epic_id + ' ' + (s.epic?.name ?? '')).match(regexEpic)) {
                return false;
            }
            if (!(s.iteration_id + ' ' + (s.iteration?.name ?? '')).match(regexIteration)) {
                return false;
            }
            if (options.owner) {
                const owned =
                    s.owners?.filter((o) => {
                        return !!`${o?.profile.name} ${o?.profile.mention_name}`.match(regexOwner);
                    }).length > 0;
                if (!owned) return false;
            }
            if (!s.name.match(regexText)) {
                return false;
            }
            if (!s.story_type.match(regexType)) {
                return false;
            }
            if (createdAtFilter && !createdAtFilter(s.created_at)) {
                return false;
            }
            if (updatedAtFilter && !updatedAtFilter(s.updated_at)) {
                return false;
            }
            return !(estimateFilter && !estimateFilter(s.estimate));
        });
};

const sortStories = (options: StoryListOptions) => {
    type SortField = [string[], string[]?];
    const fields: SortField[] = (options.sort ?? '').split(',').map((s) => {
        const parts = s.split(':');
        return [parts[0].split('.'), parts[1]?.split('.')];
    });
    const pluck = (acc: Record<string, unknown>, val: string): Record<string, unknown> => {
        const value = acc[val];
        if (value === undefined) return {};
        return value as Record<string, unknown>;
    };
    debug('sorting stories');
    return (a: StoryHydrated, b: StoryHydrated): number => {
        return fields.reduce((acc: number, field: SortField) => {
            if (acc !== 0) return acc;
            const ap = field[0].reduce(pluck, a as unknown as Record<string, unknown>);
            const bp = field[0].reduce(pluck, b as unknown as Record<string, unknown>);
            if (ap === bp) return 0;
            const direction = (field[1]?.[0] ?? '').match(/des/i) ? 1 : -1;
            if (ap > bp) {
                if (direction > 0) return -1;
            } else {
                if (direction < 0) return -1;
            }
            return 1;
        }, 0);
    };
};

interface PrintOptions {
    format?: string;
}

const printFormattedStory = (options: PrintOptions) => {
    return (story: StoryHydrated): StoryHydrated => {
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
        const format = options.format || defaultFormat;
        const labels = story.labels.map((l) => `${l.name} (#${l.id})`);
        const owners =
            story.owners?.map((o) =>
                o ? `${o.profile.name} (${o.profile.mention_name})` : 'Unknown'
            ) ?? [];
        const url = storyURL(story);
        const project = story.project ? `${story.project.name} (#${story.project.id})` : 'None';
        const requesterStr = story.requester
            ? `${story.requester.profile.name} (${story.requester.profile.mention_name})`
            : '_';
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
                    story.epic_id ? `${story.epic?.name ?? ''} (#${story.epic_id})` : '_'
                )
                .replace(/%e/, `${story.estimate || '_'}`)
                .replace(
                    /%i/,
                    story.iteration_id
                        ? `${story.iteration?.name ?? ''} (#${story.iteration_id})`
                        : '_'
                )
                .replace(/%p/, project)
                .replace(/%T/, story.group?.name || '_')
                .replace(/%o/, owners.join(', ') || '_')
                .replace(/%r/, requesterStr)
                .replace(/%s/, `${story.state?.name ?? ''} (#${story.workflow_state_id})`)
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

const storyURL = (story: StoryBase) => buildURL('story', story.id);

const printDetailedStory = (story: StoryHydrated, entities: Entities = {}): void => {
    const labels = story.labels.map((l) => {
        return chalk.bold(`#${l.id}`) + ` ${l.name}`;
    });
    const owners =
        story.owners?.map((o) => {
            if (!o) return 'Unknown';
            const mentionName = chalk.bold(`${o.profile.mention_name}`);
            return `${o.profile.name} (${mentionName})`;
        }) ?? [];

    log(chalk.blue.bold(`#${story.id}`) + chalk.blue(` ${story.name}`));
    log(chalk.bold('Desc:') + `      ${formatLong(story.description || '_')}`);
    log(chalk.bold('Team:') + `      ${story.group?.name || '_'}`);
    log(chalk.bold('Owners:') + `    ${owners.join(', ') || '_'}`);
    const requesterStr = story.requester
        ? `${story.requester.profile.name} (${story.requester.profile.mention_name})`
        : '_';
    log(chalk.bold('Requester:') + ` ${requesterStr}`);
    log(chalk.bold('Type:') + `      ${story.story_type}/${story.estimate || '_'}`);
    log(chalk.bold('Label:') + `     ${labels.join(', ') || '_'}`);
    if (story.project) {
        log(chalk.bold('Project:') + chalk.bold(`   #${story.project_id} `) + story.project.name);
    }
    if (story.group) {
        log(chalk.bold('Team:') + chalk.bold(`   #${story.group_id} `) + story.group.name);
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
    log(
        chalk.bold('State:') +
            chalk.bold(`     #${story.workflow_state_id} `) +
            (story.state?.name ?? '')
    );
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
    // Only full Story has tasks, comments, and files
    if ('tasks' in story) {
        story.tasks.map((c) => {
            log(
                chalk.bold('Task:     ') +
                    (c.complete ? '[X]' : '[ ]') +
                    ' ' +
                    formatLong(c.description)
            );
            return c;
        });
    }
    if ('comments' in story) {
        story.comments
            .filter((comment) => !comment.deleted)
            .map((c) => {
                const author = entities.membersById?.get(c.author_id);
                log(chalk.bold('Comment:') + `  ${formatLong(c.text)}`);
                const authorName = author?.profile.name ?? 'Unknown';
                log(`          ${authorName} ` + chalk.bold('at:') + ` ${c.updated_at}`);
                return c;
            });
    }
    if ('files' in story) {
        story.files.map((file) => {
            log(chalk.bold('File:') + `     ${file.name}`);
            log(`          ${file.url}`);
            return file;
        });
    }
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
    const slug = story.name
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
    findGroup,
    findState,
    findEpic,
    findIteration,
    findOwnerIds,
    findLabelNames,
    fileURL,
    storyURL,
    buildURL,
};
