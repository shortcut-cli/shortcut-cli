import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { Entities } from '../../src/lib/stories';
import type {
    EpicSlim,
    Group,
    IterationSlim,
    Label,
    Member,
    Objective,
    Project,
    Story,
    StorySlim,
    UploadedFile,
    WorkflowState,
} from '@shortcut/client';

// ---------------------------------------------------------------------------
// Helpers: synthetic test entities
// ---------------------------------------------------------------------------

function makeProject(overrides: Partial<Project> = {}): Project {
    return {
        app_url: 'https://app.shortcut.com/test/project/1',
        archived: false,
        color: '#000000',
        created_at: '2024-01-01T00:00:00Z',
        description: 'Test project',
        entity_type: 'project',
        external_id: null,
        follower_ids: [],
        global_id: 'g-project-1',
        id: 1,
        iteration_length: 2,
        name: 'Backend',
        show_thermometer: true,
        start_time: '2024-01-01T00:00:00Z',
        stats: { num_points: 0, num_related_documents: 0, num_stories: 0 },
        team_id: 1,
        updated_at: '2024-01-01T00:00:00Z',
        workflow_id: 1,
        abbreviation: 'BE',
        days_to_thermometer: 5,
        ...overrides,
    } as Project;
}

function makeWorkflowState(overrides: Partial<WorkflowState> = {}): WorkflowState {
    return {
        color: '#000000',
        created_at: '2024-01-01T00:00:00Z',
        description: 'Unstarted state',
        entity_type: 'workflow-state',
        global_id: 'g-state-500',
        id: 500,
        name: 'Unstarted',
        num_stories: 0,
        num_story_templates: 0,
        position: 0,
        type: 'unstarted',
        updated_at: '2024-01-01T00:00:00Z',
        verb: null,
        ...overrides,
    } as WorkflowState;
}

function makeMember(overrides: Partial<Member> = {}): Member {
    return {
        created_without_invite: false,
        disabled: false,
        entity_type: 'member',
        global_id: 'g-member-aaa',
        group_ids: [],
        id: 'aaa-bbb-ccc',
        profile: {
            deactivated: false,
            display_icon: null,
            entity_type: 'profile',
            gravatar_hash: null,
            id: 'aaa-bbb-ccc',
            is_owner: false,
            mention_name: 'testuser',
            name: 'Test User',
            email_address: 'test@example.com',
        },
        role: 'member',
        state: 'full' as const,
        updated_at: '2024-01-01T00:00:00Z',
        ...overrides,
    } as Member;
}

function makeGroup(overrides: Partial<Group> = {}): Group {
    return {
        app_url: 'https://app.shortcut.com/test/team/eng',
        archived: false,
        color: '#0000ff',
        color_key: 'blue',
        description: 'Engineering team',
        display_icon: null,
        entity_type: 'group',
        global_id: 'g-group-1',
        id: 'group-uuid-1',
        member_ids: [],
        mention_name: 'engineering',
        name: 'Engineering',
        num_epics_started: 0,
        num_stories: 0,
        num_stories_backlog: 0,
        num_stories_started: 0,
        updated_at: '2024-01-01T00:00:00Z',
        workflow_ids: [],
        ...overrides,
    } as Group;
}

function makeEpic(overrides: Partial<EpicSlim> = {}): EpicSlim {
    return {
        app_url: 'https://app.shortcut.com/test/epic/10',
        archived: false,
        completed: false,
        completed_at: null,
        deadline: null,
        entity_type: 'epic',
        epic_state_id: 1,
        external_id: null,
        follower_ids: [],
        global_id: 'g-epic-10',
        group_ids: [],
        group_mention_ids: [],
        id: 10,
        label_ids: [],
        labels: [],
        member_mention_ids: [],
        mention_ids: [],
        name: 'Epic Alpha',
        objective_ids: [],
        owner_ids: [],
        planned_start_date: null,
        position: 0,
        requested_by_id: 'aaa-bbb-ccc',
        started: false,
        started_at: null,
        state: 'to do',
        stats: {
            average_cycle_time: 0,
            average_lead_time: 0,
            last_story_update: null,
            num_points: 0,
            num_points_backlog: 0,
            num_points_done: 0,
            num_points_started: 0,
            num_points_unstarted: 0,
            num_related_documents: 0,
            num_stories_backlog: 0,
            num_stories_done: 0,
            num_stories_started: 0,
            num_stories_total: 0,
            num_stories_unestimated: 0,
            num_stories_unstarted: 0,
        },
        updated_at: '2024-01-01T00:00:00Z',
        ...overrides,
    } as EpicSlim;
}

function makeObjective(overrides: Partial<Objective> = {}): Objective {
    return {
        app_url: 'https://app.shortcut.com/test/objective/20',
        archived: false,
        categories: [],
        completed: false,
        completed_at: null,
        created_at: '2024-01-01T00:00:00Z',
        description: 'Objective desc',
        entity_type: 'objective',
        global_id: 'g-obj-20',
        id: 20,
        key_result_ids: [],
        name: 'Objective One',
        position: 0,
        started: false,
        started_at: null,
        state: 'to do',
        stats: {
            average_cycle_time: 0,
            average_lead_time: 0,
            last_story_update: null,
            num_points: 0,
            num_points_backlog: 0,
            num_points_done: 0,
            num_points_started: 0,
            num_points_unstarted: 0,
            num_related_documents: 0,
            num_stories_backlog: 0,
            num_stories_done: 0,
            num_stories_started: 0,
            num_stories_total: 0,
            num_stories_unestimated: 0,
            num_stories_unstarted: 0,
        },
        updated_at: '2024-01-01T00:00:00Z',
        ...overrides,
    } as Objective;
}

function makeIteration(overrides: Partial<IterationSlim> = {}): IterationSlim {
    return {
        app_url: 'https://app.shortcut.com/test/iteration/30',
        created_at: '2024-01-01T00:00:00Z',
        end_date: '2024-01-14',
        entity_type: 'iteration',
        follower_ids: [],
        global_id: 'g-iter-30',
        group_ids: [],
        group_mention_ids: [],
        id: 30,
        label_ids: [],
        labels: [],
        member_mention_ids: [],
        mention_ids: [],
        name: 'Sprint 1',
        start_date: '2024-01-01',
        stats: {
            average_cycle_time: 0,
            average_lead_time: 0,
            num_points: 0,
            num_points_backlog: 0,
            num_points_done: 0,
            num_points_started: 0,
            num_points_unstarted: 0,
            num_related_documents: 0,
            num_stories_backlog: 0,
            num_stories_done: 0,
            num_stories_started: 0,
            num_stories_unestimated: 0,
            num_stories_unstarted: 0,
        },
        status: 'unstarted',
        updated_at: '2024-01-01T00:00:00Z',
        ...overrides,
    } as IterationSlim;
}

function makeLabel(overrides: Partial<Label> = {}): Label {
    return {
        app_url: 'https://app.shortcut.com/test/label/100',
        archived: false,
        color: '#ff0000',
        created_at: '2024-01-01T00:00:00Z',
        entity_type: 'label',
        external_id: null,
        global_id: 'g-label-100',
        id: 100,
        name: 'bug',
        updated_at: '2024-01-01T00:00:00Z',
        ...overrides,
    } as Label;
}

function makeStory(overrides: Partial<Story> = {}): Story {
    return {
        app_url: 'https://app.shortcut.com/test/story/42',
        archived: false,
        blocked: false,
        blocker: false,
        branches: [],
        comments: [],
        commits: [],
        completed: false,
        completed_at: null,
        created_at: '2024-01-15T10:00:00Z',
        custom_fields: [],
        deadline: null,
        description: 'Story description',
        entity_type: 'story',
        epic_id: 10,
        estimate: 3,
        external_id: null,
        external_links: [],
        files: [],
        follower_ids: [],
        global_id: 'g-story-42',
        group_id: 'group-uuid-1',
        group_mention_ids: [],
        id: 42,
        iteration_id: 30,
        label_ids: [100],
        labels: [
            {
                app_url: '',
                archived: false,
                color: '#ff0000',
                entity_type: 'label',
                global_id: '',
                id: 100,
                name: 'bug',
            },
        ],
        lead_time: 0,
        linked_files: [],
        member_mention_ids: [],
        mention_ids: [],
        moved_at: null,
        name: 'Fix login bug',
        owner_ids: ['aaa-bbb-ccc'],
        position: 1,
        previous_iteration_ids: [],
        project_id: 1,
        pull_requests: [],
        requested_by_id: 'aaa-bbb-ccc',
        started: true,
        started_at: '2024-01-15T10:00:00Z',
        stats: { num_related_documents: 0 },
        story_links: [],
        story_type: 'feature',
        tasks: [],
        updated_at: '2024-01-16T12:00:00Z',
        workflow_id: 1,
        workflow_state_id: 500,
        ...overrides,
    } as unknown as Story;
}

function makeEntities(overrides: Partial<Entities> = {}): Entities {
    const project = makeProject();
    const state = makeWorkflowState();
    const member = makeMember();
    const group = makeGroup();
    const epic = makeEpic();
    const objective = makeObjective();
    const iteration = makeIteration();
    const label = makeLabel();

    return {
        projectsById: new Map([[project.id, project]]),
        statesById: new Map([[state.id, state]]),
        membersById: new Map([[member.id, member]]),
        groupsById: new Map([[group.id, group]]),
        epicsById: new Map([[epic.id, epic]]),
        objectivesById: new Map([[objective.id, objective]]),
        iterationsById: new Map([[iteration.id, iteration]]),
        labels: [label],
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Import stories module with mocked dependencies
// ---------------------------------------------------------------------------

async function importStories(extraMocks?: () => void) {
    vi.resetModules();

    // Mock the client module to use the Prism mock client
    vi.doMock('../../src/lib/client', async () => {
        const { ShortcutClient } = await import('@shortcut/client');
        return { default: new ShortcutClient('test-token', { baseURL: 'http://127.0.0.1:4010' }) };
    });

    // Mock configure to return test config values
    vi.doMock('../../src/lib/configure', () => ({
        loadConfig: () => ({
            token: 'test-token-for-prism-mock',
            urlSlug: 'test-workspace',
            mentionName: 'test-user',
            workspaces: {},
        }),
        loadCachedConfig: () => ({
            token: 'test-token-for-prism-mock',
            urlSlug: 'test-workspace',
            mentionName: 'test-user',
            workspaces: {},
        }),
    }));

    if (extraMocks) extraMocks();

    const mod = await import('../../src/lib/stories');
    return mod.default;
}

/**
 * Import stories with console.log spied BEFORE module load.
 * stories.ts captures `const log = console.log` at module scope,
 * so the spy must be installed before the import.
 */
async function importStoriesWithLogSpy(extraMocks?: () => void) {
    const logLines: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => {
        logLines.push(args.map(String).join(' '));
    };

    const stories = await importStories(extraMocks);

    return {
        stories,
        getOutput: () => logLines.join('\n'),
        clearOutput: () => {
            logLines.length = 0;
        },
        restore: () => {
            console.log = origLog;
        },
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('stories', () => {
    let stories: Awaited<ReturnType<typeof importStories>>;

    beforeEach(async () => {
        stories = await importStories();
    });

    // -----------------------------------------------------------------------
    // URL builders
    // -----------------------------------------------------------------------
    describe('buildURL', () => {
        it('constructs a URL with the configured workspace slug', () => {
            const url = stories.buildURL('story', 42);
            expect(url).toBe('https://app.shortcut.com/test-workspace/story/42');
        });

        it('handles multiple segments', () => {
            const url = stories.buildURL('epic', 10, 'details');
            expect(url).toBe('https://app.shortcut.com/test-workspace/epic/10/details');
        });

        it('handles a single segment', () => {
            const url = stories.buildURL('projects');
            expect(url).toBe('https://app.shortcut.com/test-workspace/projects');
        });
    });

    describe('storyURL', () => {
        it('builds the correct story URL', () => {
            const story = makeStory({ id: 99 });
            const url = stories.storyURL(story);
            expect(url).toBe('https://app.shortcut.com/test-workspace/story/99');
        });
    });

    describe('fileURL', () => {
        it('builds the correct file URL with token', () => {
            const file = {
                url: 'https://files.shortcut.com/file/123',
            } as UploadedFile;
            const url = stories.fileURL(file);
            expect(url).toBe('https://files.shortcut.com/file/123?token=test-token-for-prism-mock');
        });
    });

    // -----------------------------------------------------------------------
    // Entity finders
    // -----------------------------------------------------------------------
    describe('findProject', () => {
        it('finds project by numeric id', () => {
            const entities = makeEntities();
            const result = stories.findProject(entities, 1);
            expect(result).toBeDefined();
            expect(result!.name).toBe('Backend');
        });

        it('finds project by string id', () => {
            const entities = makeEntities();
            const result = stories.findProject(entities, '1');
            expect(result).toBeDefined();
            expect(result!.name).toBe('Backend');
        });

        it('finds project by name regex', () => {
            const entities = makeEntities();
            const result = stories.findProject(entities, 'back');
            expect(result).toBeDefined();
            expect(result!.name).toBe('Backend');
        });

        it('returns undefined for non-existent project', () => {
            const entities = makeEntities();
            const result = stories.findProject(entities, 'nonexistent');
            expect(result).toBeUndefined();
        });

        it('returns undefined when projectsById is undefined', () => {
            const entities = makeEntities({ projectsById: undefined });
            const result = stories.findProject(entities, 1);
            expect(result).toBeUndefined();
        });
    });

    describe('findGroup', () => {
        it('finds group by UUID', () => {
            const entities = makeEntities();
            const result = stories.findGroup(entities, 'group-uuid-1');
            expect(result).toBeDefined();
            expect(result!.name).toBe('Engineering');
        });

        it('finds group by name regex', () => {
            const entities = makeEntities();
            const result = stories.findGroup(entities, 'engineer');
            expect(result).toBeDefined();
            expect(result!.name).toBe('Engineering');
        });

        it('finds group by mention name', () => {
            const entities = makeEntities();
            const result = stories.findGroup(entities, 'engineering');
            expect(result).toBeDefined();
        });

        it('returns undefined for non-existent group', () => {
            const entities = makeEntities();
            const result = stories.findGroup(entities, 'no-such-group');
            expect(result).toBeUndefined();
        });
    });

    describe('findMember', () => {
        it('finds member by UUID', () => {
            const entities = makeEntities();
            const result = stories.findMember(entities, 'aaa-bbb-ccc');
            expect(result).toBeDefined();
            expect(result!.profile.name).toBe('Test User');
        });

        it('finds member by name regex', () => {
            const entities = makeEntities();
            const result = stories.findMember(entities, 'Test');
            expect(result).toBeDefined();
            expect(result!.profile.mention_name).toBe('testuser');
        });

        it('finds member by mention_name regex', () => {
            const entities = makeEntities();
            const result = stories.findMember(entities, 'testuser');
            expect(result).toBeDefined();
        });

        it('returns undefined for non-existent member', () => {
            const entities = makeEntities();
            const result = stories.findMember(entities, 'nobody');
            expect(result).toBeUndefined();
        });

        it('returns undefined when membersById is undefined', () => {
            const entities = makeEntities({ membersById: undefined });
            const result = stories.findMember(entities, 'aaa');
            expect(result).toBeUndefined();
        });
    });

    describe('findLabel', () => {
        it('finds label by numeric id', () => {
            const entities = makeEntities();
            const result = stories.findLabel(entities, 100);
            expect(result).toBeDefined();
            expect(result!.name).toBe('bug');
        });

        it('finds label by string id', () => {
            const entities = makeEntities();
            const result = stories.findLabel(entities, '100');
            expect(result).toBeDefined();
            expect(result!.name).toBe('bug');
        });

        it('finds label by name regex', () => {
            const entities = makeEntities();
            const result = stories.findLabel(entities, 'bug');
            expect(result).toBeDefined();
            expect(result!.id).toBe(100);
        });

        it('returns undefined for non-existent label', () => {
            const entities = makeEntities();
            const result = stories.findLabel(entities, 'nonexistent');
            expect(result).toBeUndefined();
        });

        it('returns undefined when labels is empty', () => {
            const entities = makeEntities({ labels: [] });
            const result = stories.findLabel(entities, 100);
            expect(result).toBeUndefined();
        });
    });

    describe('findState', () => {
        it('finds state by numeric id', () => {
            const entities = makeEntities();
            const result = stories.findState(entities, 500);
            expect(result).toBeDefined();
            expect(result!.name).toBe('Unstarted');
        });

        it('finds state by string id', () => {
            const entities = makeEntities();
            const result = stories.findState(entities, '500');
            expect(result).toBeDefined();
            expect(result!.name).toBe('Unstarted');
        });

        it('finds state by name regex', () => {
            const entities = makeEntities();
            const result = stories.findState(entities, 'unstart');
            expect(result).toBeDefined();
            expect(result!.id).toBe(500);
        });

        it('returns undefined for non-existent state', () => {
            const entities = makeEntities();
            const result = stories.findState(entities, 'nonexistent');
            expect(result).toBeUndefined();
        });
    });

    describe('findEpic', () => {
        it('finds epic by numeric id', () => {
            const entities = makeEntities();
            const result = stories.findEpic(entities, 10);
            expect(result).toBeDefined();
            expect(result!.name).toBe('Epic Alpha');
        });

        it('finds epic by string id', () => {
            const entities = makeEntities();
            const result = stories.findEpic(entities, '10');
            expect(result).toBeDefined();
        });

        it('finds epic by name regex', () => {
            const entities = makeEntities();
            const result = stories.findEpic(entities, 'Alpha');
            expect(result).toBeDefined();
            expect(result!.id).toBe(10);
        });

        it('returns undefined for non-existent epic', () => {
            const entities = makeEntities();
            const result = stories.findEpic(entities, 'nonexistent');
            expect(result).toBeUndefined();
        });
    });

    describe('findObjective', () => {
        it('finds objective by numeric id', () => {
            const entities = makeEntities();
            const result = stories.findObjective(entities, 20);
            expect(result).toBeDefined();
            expect(result!.name).toBe('Objective One');
        });

        it('finds objective by name regex', () => {
            const entities = makeEntities();
            const result = stories.findObjective(entities, 'One');
            expect(result).toBeDefined();
            expect(result!.id).toBe(20);
        });

        it('returns undefined for non-existent objective', () => {
            const entities = makeEntities();
            const result = stories.findObjective(entities, 'nonexistent');
            expect(result).toBeUndefined();
        });
    });

    describe('findIteration', () => {
        it('finds iteration by numeric id', () => {
            const entities = makeEntities();
            const result = stories.findIteration(entities, 30);
            expect(result).toBeDefined();
            expect(result!.name).toBe('Sprint 1');
        });

        it('finds iteration by name regex', () => {
            const entities = makeEntities();
            const result = stories.findIteration(entities, 'Sprint');
            expect(result).toBeDefined();
            expect(result!.id).toBe(30);
        });

        it('returns undefined for non-existent iteration', () => {
            const entities = makeEntities();
            const result = stories.findIteration(entities, 'nonexistent');
            expect(result).toBeUndefined();
        });
    });

    // -----------------------------------------------------------------------
    // Multi-entity finders
    // -----------------------------------------------------------------------
    describe('findOwnerIds', () => {
        it('finds owner IDs from comma-separated name list', () => {
            const member2 = makeMember({
                id: 'ddd-eee-fff',
                profile: {
                    deactivated: false,
                    display_icon: null,
                    entity_type: 'profile',
                    gravatar_hash: null,
                    id: 'ddd-eee-fff',
                    is_owner: false,
                    mention_name: 'anotheruser',
                    name: 'Another User',
                    email_address: 'another@example.com',
                },
            });
            const entities = makeEntities({
                membersById: new Map([
                    ['aaa-bbb-ccc', makeMember()],
                    ['ddd-eee-fff', member2],
                ]),
            });

            const ids = stories.findOwnerIds(entities, 'testuser,anotheruser');
            expect(ids).toContain('aaa-bbb-ccc');
            expect(ids).toContain('ddd-eee-fff');
            expect(ids).toHaveLength(2);
        });

        it('returns empty array when no members match', () => {
            const entities = makeEntities();
            const ids = stories.findOwnerIds(entities, 'nobody');
            expect(ids).toEqual([]);
        });

        it('handles empty membersById', () => {
            const entities = makeEntities({ membersById: undefined });
            const ids = stories.findOwnerIds(entities, 'testuser');
            expect(ids).toEqual([]);
        });
    });

    describe('findLabelNames', () => {
        it('finds label names from comma-separated list', () => {
            const label2 = makeLabel({ id: 101, name: 'enhancement' });
            const entities = makeEntities({ labels: [makeLabel(), label2] });

            const result = stories.findLabelNames(entities, 'bug,enhancement');
            expect(result).toEqual([{ name: 'bug' }, { name: 'enhancement' }]);
        });

        it('returns empty array when no labels match', () => {
            const entities = makeEntities();
            const result = stories.findLabelNames(entities, 'nonexistent');
            expect(result).toEqual([]);
        });
    });

    describe('findObjectiveIds', () => {
        it('finds objective IDs from comma-separated list', () => {
            const obj2 = makeObjective({ id: 21, name: 'Objective Two' });
            const entities = makeEntities({
                objectivesById: new Map([
                    [20, makeObjective()],
                    [21, obj2],
                ]),
            });

            const ids = stories.findObjectiveIds(entities, 'Objective One,Objective Two');
            expect(ids).toContain(20);
            expect(ids).toContain(21);
            expect(ids).toHaveLength(2);
        });

        it('filters out non-matching objectives', () => {
            const entities = makeEntities();
            const ids = stories.findObjectiveIds(entities, 'Objective One,nonexistent');
            expect(ids).toEqual([20]);
        });

        it('returns empty array for no matches', () => {
            const entities = makeEntities();
            const ids = stories.findObjectiveIds(entities, 'nonexistent');
            expect(ids).toEqual([]);
        });

        it('handles empty string entries from split', () => {
            const entities = makeEntities();
            const ids = stories.findObjectiveIds(entities, ',,,');
            expect(ids).toEqual([]);
        });
    });

    // -----------------------------------------------------------------------
    // hydrateStory
    // -----------------------------------------------------------------------
    describe('hydrateStory', () => {
        it('augments a story with resolved entities', () => {
            const entities = makeEntities();
            const story = makeStory();
            const hydrated = stories.hydrateStory(entities, story);

            expect(hydrated.project).toBeDefined();
            expect(hydrated.project!.name).toBe('Backend');
            expect(hydrated.state).toBeDefined();
            expect(hydrated.state!.name).toBe('Unstarted');
            expect(hydrated.epic).toBeDefined();
            expect(hydrated.epic!.name).toBe('Epic Alpha');
            expect(hydrated.iteration).toBeDefined();
            expect(hydrated.iteration!.name).toBe('Sprint 1');
            expect(hydrated.group).toBeDefined();
            expect(hydrated.group!.name).toBe('Engineering');
            expect(hydrated.owners).toHaveLength(1);
            expect(hydrated.owners![0]!.profile.name).toBe('Test User');
            expect(hydrated.requester).toBeDefined();
            expect(hydrated.requester!.profile.name).toBe('Test User');
        });

        it('handles missing entities gracefully', () => {
            const entities = makeEntities({
                projectsById: new Map(),
                statesById: new Map(),
                epicsById: new Map(),
                iterationsById: new Map(),
                groupsById: new Map(),
                membersById: new Map(),
            });
            const story = makeStory();
            const hydrated = stories.hydrateStory(entities, story);

            expect(hydrated.project).toBeUndefined();
            expect(hydrated.state).toBeUndefined();
            expect(hydrated.epic).toBeUndefined();
            expect(hydrated.iteration).toBeUndefined();
            expect(hydrated.group).toBeUndefined();
            expect(hydrated.owners![0]).toBeUndefined();
            expect(hydrated.requester).toBeUndefined();
        });

        it('works with a StorySlim (no epic_id/iteration_id)', () => {
            const entities = makeEntities();
            const slim = makeStory({
                epic_id: null,
                iteration_id: null,
                group_id: null,
            }) as unknown as StorySlim;
            const hydrated = stories.hydrateStory(entities, slim);

            expect(hydrated.epic).toBeUndefined();
            expect(hydrated.iteration).toBeUndefined();
            expect(hydrated.group).toBeUndefined();
        });
    });

    // -----------------------------------------------------------------------
    // fetchEntities (hits Prism)
    // -----------------------------------------------------------------------
    describe('fetchEntities', () => {
        it('returns entities maps from Prism mock data', async () => {
            const entities = await stories.fetchEntities();

            expect(entities.projectsById).toBeInstanceOf(Map);
            expect(entities.statesById).toBeInstanceOf(Map);
            expect(entities.membersById).toBeInstanceOf(Map);
            expect(entities.groupsById).toBeInstanceOf(Map);
            expect(entities.epicsById).toBeInstanceOf(Map);
            expect(entities.objectivesById).toBeInstanceOf(Map);
            expect(entities.iterationsById).toBeInstanceOf(Map);
            expect(Array.isArray(entities.labels)).toBe(true);
        });
    });

    // -----------------------------------------------------------------------
    // filterStories (exercises parseDateComparator / parseNumberComparator)
    // -----------------------------------------------------------------------
    describe('filterStories (via listStories internals)', () => {
        // We can't call filterStories directly since it's not exported,
        // but we can call listStories with options that exercise filters.
        // However, we can test indirectly via listStories, or we can test
        // the behavior via the filtering logic on synthetic data.

        // Since filterStories is internal, let's test it by importing the module
        // and using listStories. But for more targeted tests, we'll test the
        // behavior by constructing scenarios.

        it('filters by text regex', async () => {
            // This tests via the Prism data; the key validation is that
            // listStories returns without error with a text filter
            const result = await stories.listStories({ text: 'nonexistent-text-xyz' });
            // All stories that don't match the text filter should be excluded
            for (const s of result) {
                expect(s.name).toMatch(/nonexistent-text-xyz/i);
            }
        });

        it('filters by story type', async () => {
            const result = await stories.listStories({ type: 'feature' });
            for (const s of result) {
                expect(s.story_type).toMatch(/feature/i);
            }
        });

        it('filters by state regex', async () => {
            const result = await stories.listStories({ state: '.*' });
            // Should return all stories since .* matches everything
            expect(Array.isArray(result)).toBe(true);
        });

        it('filters by created date with < comparator', async () => {
            const result = await stories.listStories({ created: '<2099-01-01' });
            for (const s of result) {
                expect(new Date(s.created_at).getTime()).toBeLessThan(
                    new Date('2099-01-01').getTime()
                );
            }
        });

        it('filters by created date with > comparator', async () => {
            const result = await stories.listStories({ created: '>2000-01-01' });
            for (const s of result) {
                expect(new Date(s.created_at).getTime()).toBeGreaterThan(
                    new Date('2000-01-01').getTime()
                );
            }
        });

        it('filters by created date with = comparator', async () => {
            // = comparator checks date equality (truncated to the date string length)
            const result = await stories.listStories({ created: '=2024-01-01' });
            // Result may be empty, but should not throw
            expect(Array.isArray(result)).toBe(true);
        });

        it('filters by updated date', async () => {
            const result = await stories.listStories({ updated: '>2000-01-01' });
            expect(Array.isArray(result)).toBe(true);
        });

        it('filters by estimate with > comparator', async () => {
            const result = await stories.listStories({ estimate: '>0' });
            for (const s of result) {
                expect(Number(s.estimate)).toBeGreaterThan(0);
            }
        });

        it('filters by estimate with < comparator', async () => {
            const result = await stories.listStories({ estimate: '<100' });
            for (const s of result) {
                expect(Number(s.estimate)).toBeLessThan(100);
            }
        });

        it('filters by estimate with = comparator', async () => {
            const result = await stories.listStories({ estimate: '=0' });
            expect(Array.isArray(result)).toBe(true);
        });

        it('excludes archived stories by default', async () => {
            const result = await stories.listStories({});
            for (const s of result) {
                expect(s.archived).toBe(false);
            }
        });

        it('includes archived stories when option is set', async () => {
            const result = await stories.listStories({ archived: true });
            expect(Array.isArray(result)).toBe(true);
        });
    });

    // -----------------------------------------------------------------------
    // sortStories
    // -----------------------------------------------------------------------
    describe('sortStories (via listStories)', () => {
        it('sorts stories by id ascending (default)', async () => {
            const result = await stories.listStories({ sort: 'id' });
            for (let i = 1; i < result.length; i++) {
                expect(result[i].id).toBeGreaterThanOrEqual(result[i - 1].id);
            }
        });

        it('sorts stories by id descending', async () => {
            const result = await stories.listStories({ sort: 'id:desc' });
            for (let i = 1; i < result.length; i++) {
                expect(result[i].id).toBeLessThanOrEqual(result[i - 1].id);
            }
        });

        it('handles empty sort option gracefully', async () => {
            const result = await stories.listStories({ sort: '' });
            expect(Array.isArray(result)).toBe(true);
        });
    });

    // -----------------------------------------------------------------------
    // listStories
    // -----------------------------------------------------------------------
    describe('listStories', () => {
        it('fetches stories by project when no args provided', async () => {
            const result = await stories.listStories({});
            expect(Array.isArray(result)).toBe(true);
        });

        it('uses search endpoint when args are provided', async () => {
            // Prism mock may return a `next` cursor causing pagination.
            // Use a fresh import with mocked client that returns no next cursor.
            vi.resetModules();
            const mockSearchStories = vi.fn().mockResolvedValue({
                data: { data: [], next: null, total: 0 },
            });
            vi.doMock('../../src/lib/client', () => ({
                default: {
                    listProjects: vi.fn().mockResolvedValue({ data: [] }),
                    listWorkflows: vi.fn().mockResolvedValue({ data: [] }),
                    listMembers: vi.fn().mockResolvedValue({ data: [] }),
                    listGroups: vi.fn().mockResolvedValue({ data: [] }),
                    listEpics: vi.fn().mockResolvedValue({ data: [] }),
                    listObjectives: vi.fn().mockResolvedValue({ data: [] }),
                    listIterations: vi.fn().mockResolvedValue({ data: [] }),
                    listLabels: vi.fn().mockResolvedValue({ data: [] }),
                    searchStories: mockSearchStories,
                },
            }));
            vi.doMock('../../src/lib/configure', () => ({
                loadConfig: () => ({
                    token: 'test-token',
                    urlSlug: 'test-workspace',
                    mentionName: 'test-user',
                    workspaces: {},
                }),
            }));
            const mod = await import('../../src/lib/stories');
            const result = await mod.default.listStories({ args: ['test query'] });
            expect(Array.isArray(result)).toBe(true);
            expect(mockSearchStories).toHaveBeenCalled();
        });

        it('filters stories by project regex', async () => {
            const result = await stories.listStories({ project: '.*' });
            expect(Array.isArray(result)).toBe(true);
        });

        it('replaces %self% in search args with mentionName', async () => {
            // Prism mock may return a `next` cursor causing pagination.
            // Use a fresh import with mocked client.
            vi.resetModules();
            const mockSearchStories = vi.fn().mockResolvedValue({
                data: { data: [], next: null, total: 0 },
            });
            vi.doMock('../../src/lib/client', () => ({
                default: {
                    listProjects: vi.fn().mockResolvedValue({ data: [] }),
                    listWorkflows: vi.fn().mockResolvedValue({ data: [] }),
                    listMembers: vi.fn().mockResolvedValue({ data: [] }),
                    listGroups: vi.fn().mockResolvedValue({ data: [] }),
                    listEpics: vi.fn().mockResolvedValue({ data: [] }),
                    listObjectives: vi.fn().mockResolvedValue({ data: [] }),
                    listIterations: vi.fn().mockResolvedValue({ data: [] }),
                    listLabels: vi.fn().mockResolvedValue({ data: [] }),
                    searchStories: mockSearchStories,
                },
            }));
            vi.doMock('../../src/lib/configure', () => ({
                loadConfig: () => ({
                    token: 'test-token',
                    urlSlug: 'test-workspace',
                    mentionName: 'test-user',
                    workspaces: {},
                }),
            }));
            const mod = await import('../../src/lib/stories');
            const result = await mod.default.listStories({ args: ['owner:%self%'] });
            expect(Array.isArray(result)).toBe(true);
            // Verify %self% was replaced with 'test-user'
            const calledQuery = mockSearchStories.mock.calls[0][0].query;
            expect(calledQuery).toContain('test-user');
            expect(calledQuery).not.toContain('%self%');
        });

        it('filters by label option', async () => {
            const result = await stories.listStories({ label: 'some-label' });
            expect(Array.isArray(result)).toBe(true);
        });

        it('filters by epic option', async () => {
            const result = await stories.listStories({ epic: 'some-epic' });
            expect(Array.isArray(result)).toBe(true);
        });

        it('filters by iteration option', async () => {
            const result = await stories.listStories({ iteration: 'some-iteration' });
            expect(Array.isArray(result)).toBe(true);
        });

        it('filters by owner option', async () => {
            const result = await stories.listStories({ owner: 'testuser' });
            expect(Array.isArray(result)).toBe(true);
        });
    });

    // -----------------------------------------------------------------------
    // printFormattedStory
    // -----------------------------------------------------------------------
    describe('printFormattedStory', () => {
        it('prints story with default format', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                const result = ctx.stories.printFormattedStory({})(story);
                const output = ctx.getOutput();
                expect(output).toContain('42');
                expect(output).toContain('Fix login bug');
                expect(result.id).toBe(42);
            } finally {
                ctx.restore();
            }
        });

        it('prints story with custom format', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '#%id %t [%y] (%s)' })(story);
                const output = ctx.getOutput();
                expect(output).toContain('42');
                expect(output).toContain('Fix login bug');
                expect(output).toContain('feature');
                expect(output).toContain('Unstarted');
            } finally {
                ctx.restore();
            }
        });

        it('prints JSON format with %j', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '%j' })(story);
                const output = ctx.getOutput();
                expect(() => JSON.parse(output)).not.toThrow();
                const parsed = JSON.parse(output);
                expect(parsed.id).toBe(42);
                expect(parsed.url).toBe('https://app.shortcut.com/test-workspace/story/42');
            } finally {
                ctx.restore();
            }
        });

        it('prints description with %d', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(
                    entities,
                    makeStory({ description: 'My description' })
                );
                ctx.stories.printFormattedStory({ format: '%d' })(story);
                expect(ctx.getOutput()).toContain('My description');
            } finally {
                ctx.restore();
            }
        });

        it('prints labels with %l', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '%l' })(story);
                expect(ctx.getOutput()).toContain('bug');
            } finally {
                ctx.restore();
            }
        });

        it('prints owners with %o', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '%o' })(story);
                const output = ctx.getOutput();
                expect(output).toContain('Test User');
                expect(output).toContain('testuser');
            } finally {
                ctx.restore();
            }
        });

        it('prints URL with %u', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '%u' })(story);
                expect(ctx.getOutput()).toContain(
                    'https://app.shortcut.com/test-workspace/story/42'
                );
            } finally {
                ctx.restore();
            }
        });

        it('prints git branch with %gb', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '%gb' })(story);
                expect(ctx.getOutput()).toContain('test-user/sc-42/feature-fix-login-bug');
            } finally {
                ctx.restore();
            }
        });

        it('prints git branch with short prefix using %gbs', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '%gbs' })(story);
                expect(ctx.getOutput()).toContain('test-user/sc-42/');
            } finally {
                ctx.restore();
            }
        });

        it('prints team name with %T', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '%T' })(story);
                expect(ctx.getOutput()).toContain('Engineering');
            } finally {
                ctx.restore();
            }
        });

        it('prints _ when no owners', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities({ membersById: new Map() });
                const story = ctx.stories.hydrateStory(entities, makeStory({ owner_ids: [] }));
                ctx.stories.printFormattedStory({ format: 'owners=%o' })(story);
                expect(ctx.getOutput()).toContain('owners=_');
            } finally {
                ctx.restore();
            }
        });

        it('prints requester with %r', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '%r' })(story);
                expect(ctx.getOutput()).toContain('Test User');
            } finally {
                ctx.restore();
            }
        });

        it('prints _ for requester when not resolved', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities({ membersById: new Map() });
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: 'req=%r' })(story);
                expect(ctx.getOutput()).toContain('req=_');
            } finally {
                ctx.restore();
            }
        });

        it('prints project info with %p', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '%p' })(story);
                expect(ctx.getOutput()).toContain('Backend');
            } finally {
                ctx.restore();
            }
        });

        it('prints None for project when not resolved', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities({ projectsById: new Map() });
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '%p' })(story);
                expect(ctx.getOutput()).toContain('None');
            } finally {
                ctx.restore();
            }
        });

        it('prints epic info with %epic', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '%epic' })(story);
                const output = ctx.getOutput();
                expect(output).toContain('Epic Alpha');
                expect(output).toContain('#10');
            } finally {
                ctx.restore();
            }
        });

        it('prints _ for epic when not set', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory({ epic_id: null }));
                ctx.stories.printFormattedStory({ format: 'epic=%epic' })(story);
                expect(ctx.getOutput()).toContain('epic=_');
            } finally {
                ctx.restore();
            }
        });

        it('prints iteration info with %i', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '%i' })(story);
                const output = ctx.getOutput();
                expect(output).toContain('Sprint 1');
                expect(output).toContain('#30');
            } finally {
                ctx.restore();
            }
        });

        it('prints _ for iteration when not set', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory({ iteration_id: null }));
                ctx.stories.printFormattedStory({ format: 'iter=%i' })(story);
                expect(ctx.getOutput()).toContain('iter=_');
            } finally {
                ctx.restore();
            }
        });

        it('prints created_at with %c', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '%c' })(story);
                expect(ctx.getOutput()).toContain('2024-01-15T10:00:00Z');
            } finally {
                ctx.restore();
            }
        });

        it('prints updated_at with %updated when different from created_at', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '%updated' })(story);
                expect(ctx.getOutput()).toContain('2024-01-16T12:00:00Z');
            } finally {
                ctx.restore();
            }
        });

        it('prints _ for %updated when same as created_at', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(
                    entities,
                    makeStory({
                        created_at: '2024-01-15T10:00:00Z',
                        updated_at: '2024-01-15T10:00:00Z',
                    })
                );
                ctx.stories.printFormattedStory({ format: 'upd=%updated' })(story);
                expect(ctx.getOutput()).toContain('upd=_');
            } finally {
                ctx.restore();
            }
        });

        it('prints archived with %a', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printFormattedStory({ format: '%a' })(story);
                expect(ctx.getOutput()).toContain('false');
            } finally {
                ctx.restore();
            }
        });

        it('prints estimate with %e', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory({ estimate: 5 }));
                ctx.stories.printFormattedStory({ format: '%y/%e' })(story);
                expect(ctx.getOutput()).toContain('feature/5');
            } finally {
                ctx.restore();
            }
        });

        it('prints _ for estimate when null', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory({ estimate: null }));
                ctx.stories.printFormattedStory({ format: '%y/%e' })(story);
                expect(ctx.getOutput()).toContain('feature/_');
            } finally {
                ctx.restore();
            }
        });
    });

    // -----------------------------------------------------------------------
    // printDetailedStory
    // -----------------------------------------------------------------------
    describe('printDetailedStory', () => {
        it('prints detailed story information', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printDetailedStory(story, entities);
                const output = ctx.getOutput();
                expect(output).toContain('42');
                expect(output).toContain('Fix login bug');
                expect(output).toContain('Test User');
                expect(output).toContain('Backend');
                expect(output).toContain('Epic Alpha');
                expect(output).toContain('Sprint 1');
                expect(output).toContain('Unstarted');
                expect(output).toContain('feature');
                expect(output).toContain('2024-01-15T10:00:00Z');
                expect(output).toContain('story/42');
            } finally {
                ctx.restore();
            }
        });

        it('prints detailed story with no entities argument', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printDetailedStory(story);
                const output = ctx.getOutput();
                expect(output.length).toBeGreaterThan(0);
                expect(output).toContain('42');
            } finally {
                ctx.restore();
            }
        });

        it('prints Updated line when updated_at differs from created_at', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printDetailedStory(story, entities);
                const output = ctx.getOutput();
                expect(output).toContain('Updated:');
                expect(output).toContain('2024-01-16T12:00:00Z');
            } finally {
                ctx.restore();
            }
        });

        it('does not print Updated line when times are equal', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(
                    entities,
                    makeStory({
                        created_at: '2024-01-15T10:00:00Z',
                        updated_at: '2024-01-15T10:00:00Z',
                    })
                );
                ctx.stories.printDetailedStory(story, entities);
                expect(ctx.getOutput()).not.toContain('Updated:');
            } finally {
                ctx.restore();
            }
        });

        it('prints Archived line when story is archived', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory({ archived: true }));
                ctx.stories.printDetailedStory(story, entities);
                const output = ctx.getOutput();
                expect(output).toContain('Archived:');
                expect(output).toContain('true');
            } finally {
                ctx.restore();
            }
        });

        it('does not print Archived line when story is not archived', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory({ archived: false }));
                ctx.stories.printDetailedStory(story, entities);
                expect(ctx.getOutput()).not.toContain('Archived:');
            } finally {
                ctx.restore();
            }
        });

        it('prints Completed line when story is completed', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(
                    entities,
                    makeStory({ completed: true, completed_at: '2024-02-01T00:00:00Z' })
                );
                ctx.stories.printDetailedStory(story, entities);
                const output = ctx.getOutput();
                expect(output).toContain('Completed:');
                expect(output).toContain('2024-02-01T00:00:00Z');
            } finally {
                ctx.restore();
            }
        });

        it('prints tasks', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(
                    entities,
                    makeStory({
                        tasks: [
                            {
                                complete: false,
                                completed_at: null,
                                created_at: '2024-01-01T00:00:00Z',
                                description: 'Write tests',
                                entity_type: 'story-task',
                                external_id: null,
                                group_mention_ids: [],
                                id: 1,
                                member_mention_ids: [],
                                mention_ids: [],
                                owner_ids: [],
                                position: 0,
                                story_id: 42,
                                updated_at: '2024-01-01T00:00:00Z',
                            },
                            {
                                complete: true,
                                completed_at: '2024-01-02T00:00:00Z',
                                created_at: '2024-01-01T00:00:00Z',
                                description: 'Review PR',
                                entity_type: 'story-task',
                                external_id: null,
                                group_mention_ids: [],
                                id: 2,
                                member_mention_ids: [],
                                mention_ids: [],
                                owner_ids: [],
                                position: 1,
                                story_id: 42,
                                updated_at: '2024-01-02T00:00:00Z',
                            },
                        ] as any,
                    })
                );
                ctx.stories.printDetailedStory(story, entities);
                const output = ctx.getOutput();
                expect(output).toContain('Task:');
                expect(output).toContain('[ ]');
                expect(output).toContain('Write tests');
                expect(output).toContain('[X]');
                expect(output).toContain('Review PR');
            } finally {
                ctx.restore();
            }
        });

        it('prints comments', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(
                    entities,
                    makeStory({
                        comments: [
                            {
                                app_url: '',
                                author_id: 'aaa-bbb-ccc',
                                created_at: '2024-01-15T11:00:00Z',
                                deleted: false,
                                entity_type: 'story-comment',
                                external_id: null,
                                group_mention_ids: [],
                                id: 1,
                                member_mention_ids: [],
                                mention_ids: [],
                                position: 0,
                                story_id: 42,
                                text: 'This looks good!',
                                updated_at: '2024-01-15T11:00:00Z',
                            },
                        ] as any,
                    })
                );
                ctx.stories.printDetailedStory(story, entities);
                const output = ctx.getOutput();
                expect(output).toContain('Comment:');
                expect(output).toContain('This looks good!');
                expect(output).toContain('Test User');
            } finally {
                ctx.restore();
            }
        });

        it('skips deleted comments', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(
                    entities,
                    makeStory({
                        comments: [
                            {
                                app_url: '',
                                author_id: 'aaa-bbb-ccc',
                                created_at: '2024-01-15T11:00:00Z',
                                deleted: true,
                                entity_type: 'story-comment',
                                external_id: null,
                                group_mention_ids: [],
                                id: 1,
                                member_mention_ids: [],
                                mention_ids: [],
                                position: 0,
                                story_id: 42,
                                text: 'Deleted comment',
                                updated_at: '2024-01-15T11:00:00Z',
                            },
                        ] as any,
                    })
                );
                ctx.stories.printDetailedStory(story, entities);
                expect(ctx.getOutput()).not.toContain('Deleted comment');
            } finally {
                ctx.restore();
            }
        });

        it('prints files', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(
                    entities,
                    makeStory({
                        files: [
                            {
                                content_type: 'image/png',
                                created_at: '2024-01-15T10:00:00Z',
                                description: null,
                                entity_type: 'uploaded-file',
                                external_id: null,
                                filename: 'screenshot.png',
                                group_mention_ids: [],
                                id: 1,
                                member_mention_ids: [],
                                mention_ids: [],
                                name: 'screenshot.png',
                                size: 1024,
                                story_ids: [42],
                                thumbnail_url: null,
                                updated_at: '2024-01-15T10:00:00Z',
                                uploader_id: 'aaa-bbb-ccc',
                                url: 'https://files.shortcut.com/screenshot.png',
                            },
                        ] as any,
                    })
                );
                ctx.stories.printDetailedStory(story, entities);
                const output = ctx.getOutput();
                expect(output).toContain('File:');
                expect(output).toContain('screenshot.png');
                expect(output).toContain('https://files.shortcut.com/screenshot.png');
            } finally {
                ctx.restore();
            }
        });

        it('prints _ for epic when not set', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory({ epic_id: null }));
                ctx.stories.printDetailedStory(story, entities);
                expect(ctx.getOutput()).toMatch(/Epic:.*_/);
            } finally {
                ctx.restore();
            }
        });

        it('prints _ for iteration when not set', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory({ iteration_id: null }));
                ctx.stories.printDetailedStory(story, entities);
                expect(ctx.getOutput()).toMatch(/Iteration:.*_/);
            } finally {
                ctx.restore();
            }
        });

        it('prints Unknown for unresolved owner', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities({ membersById: new Map() });
                const story = ctx.stories.hydrateStory(entities, makeStory());
                ctx.stories.printDetailedStory(story, entities);
                expect(ctx.getOutput()).toContain('Unknown');
            } finally {
                ctx.restore();
            }
        });

        it('prints _ for owners when there are none', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(entities, makeStory({ owner_ids: [] }));
                ctx.stories.printDetailedStory(story, entities);
                expect(ctx.getOutput()).toMatch(/Owners:.*_/);
            } finally {
                ctx.restore();
            }
        });

        it('handles multiline description', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(
                    entities,
                    makeStory({ description: 'Line 1\nLine 2\nLine 3' })
                );
                ctx.stories.printDetailedStory(story, entities);
                const output = ctx.getOutput();
                expect(output).toContain('Line 1');
                expect(output).toContain('Line 2');
                expect(output).toContain('Line 3');
            } finally {
                ctx.restore();
            }
        });
    });

    // -----------------------------------------------------------------------
    // buildStoryBranch (tested indirectly via printFormattedStory %gb/%gbs)
    // -----------------------------------------------------------------------
    describe('buildStoryBranch (via %gb format)', () => {
        it('builds branch name from story name', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(
                    entities,
                    makeStory({ name: 'Add User Auth Flow' })
                );
                ctx.stories.printFormattedStory({ format: '%gb' })(story);
                expect(ctx.getOutput()).toContain('test-user/sc-42/feature-add-user-auth-flow');
            } finally {
                ctx.restore();
            }
        });

        it('truncates branch name to 30 chars', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(
                    entities,
                    makeStory({
                        name: 'This is a very long story name that should be truncated for branch',
                    })
                );
                ctx.stories.printFormattedStory({ format: '%gb' })(story);
                const output = ctx.getOutput();
                const match = output.match(/test-user\/sc-42\/feature-(.+)/);
                expect(match).toBeTruthy();
                expect(match![1].length).toBeLessThanOrEqual(30);
            } finally {
                ctx.restore();
            }
        });

        it('strips special characters from branch name', async () => {
            const ctx = await importStoriesWithLogSpy();
            try {
                const entities = makeEntities();
                const story = ctx.stories.hydrateStory(
                    entities,
                    makeStory({ name: 'Fix: Bug #123 (urgent!)' })
                );
                ctx.stories.printFormattedStory({ format: '%gb' })(story);
                expect(ctx.getOutput()).not.toMatch(/[#()!:]/);
            } finally {
                ctx.restore();
            }
        });
    });

    // -----------------------------------------------------------------------
    // checkoutStoryBranch
    // -----------------------------------------------------------------------
    describe('checkoutStoryBranch', () => {
        it('executes git checkout command', async () => {
            const mockExecSync = vi.fn();

            const storiesMod = await importStories(() => {
                vi.doMock('child_process', () => ({
                    execSync: mockExecSync,
                }));
            });

            const entities = makeEntities();
            const story = storiesMod.hydrateStory(entities, makeStory({ name: 'My Feature' }));

            storiesMod.checkoutStoryBranch(story);

            expect(mockExecSync).toHaveBeenCalledTimes(1);
            const cmd = mockExecSync.mock.calls[0][0] as string;
            expect(cmd).toContain('git checkout');
            expect(cmd).toContain('test-user/sc-42/feature-my-feature');
        });

        it('executes git checkout with custom prefix', async () => {
            const mockExecSync = vi.fn();

            const storiesMod = await importStories(() => {
                vi.doMock('child_process', () => ({
                    execSync: mockExecSync,
                }));
            });

            const entities = makeEntities();
            const story = storiesMod.hydrateStory(entities, makeStory({ name: 'My Feature' }));

            storiesMod.checkoutStoryBranch(story, 'custom-prefix/');

            expect(mockExecSync).toHaveBeenCalledTimes(1);
            const cmd = mockExecSync.mock.calls[0][0] as string;
            expect(cmd).toContain('custom-prefix/my-feature');
        });
    });

    // -----------------------------------------------------------------------
    // parseDateComparator (exercised via filterStories)
    // -----------------------------------------------------------------------
    describe('parseDateComparator (via filterStories)', () => {
        // These are tested indirectly through listStories with created/updated filters.
        // Let's add more targeted tests here.

        it('date < filter excludes stories after the date', async () => {
            const result = await stories.listStories({ created: '<1990-01-01' });
            // No story should have been created before 1990
            expect(result).toHaveLength(0);
        });

        it('date > filter works with future dates', async () => {
            const result = await stories.listStories({ created: '>2099-01-01' });
            // No story should be created after 2099
            expect(result).toHaveLength(0);
        });
    });

    // -----------------------------------------------------------------------
    // parseNumberComparator (exercised via filterStories)
    // -----------------------------------------------------------------------
    describe('parseNumberComparator (via filterStories)', () => {
        it('estimate < 0 returns no stories', async () => {
            const result = await stories.listStories({ estimate: '<0' });
            expect(result).toHaveLength(0);
        });

        it('estimate > 999999 returns no stories', async () => {
            const result = await stories.listStories({ estimate: '>999999' });
            expect(result).toHaveLength(0);
        });
    });
});
