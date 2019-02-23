const { execSync } = require('child_process');
const chalk        = require('chalk');
const debug        = require('debug')('club');
const client       = require('./client.js');
const config       = require('../lib/configure.js').loadConfig();
const log     = console.log;
let wfs = [];
let projects = [];
let members = [];
let epics = [];
let wf = { states: [] };

const listStories = async (program) => {
    debug('request workflows, members, projects, epics');
    [ wfs, members, projects, epics ] = await Promise.all([
        client.listWorkflows(),
        client.listMembers(),
        client.listProjects(),
        client.listEpics(),
    ]);
    debug('response workflows, members, projects, epics');
    wf = wfs[0];    // TODO: this is always getting the default workflow

    let stories;
    if (program.args.length) {
        stories = await searchStories(program);
    } else {
        debug('filtering projects');
        let regexProject = new RegExp(program.project, 'i');
        const filteredProjects = projects
            .filter(p => !!(p.id + p.name).match(regexProject));
        stories = await Promise.all(filteredProjects.map(fetchStories))
            .then(f => f.reduce((acc, arr) => acc.concat(arr), []));
    }
    debug('filtering stories');
    const projectsById = projects.reduce((o, project) => ({ ...o, [project.id]: project }), {});
    return filterStories(program, projectsById, stories)
        .sort(sortStories(program));
};

const fetchStories = async (project) => {
    debug('request stories for project', project.id);
    return client.listStories(project.id);
};

const searchStories = async (program) => {
    return new Promise((resolve, reject) => {
        let stories = [];

        const processResult = result => {
            stories = stories.concat(result.data);
            if (result.next) {
                client.getResource(result.next)
                    .then(processResult)
                    .catch(reject);
            } else {
                resolve(stories);
            }
        };

        client.searchStories(program.args.join(' '))
            .then(processResult)
            .catch(reject);
    });
};

const filterStories = (program, projectsById, stories) => {
    let created_at = false;
    if (program.created)
        created_at = parseDateComparator(program.created);
    let updated_at = false;
    if (program.updated)
        updated_at = parseDateComparator(program.updated);
    let regexLabel = new RegExp(program.label, 'i');
    let regexState = new RegExp(program.state, 'i');
    let regexOwner = new RegExp(program.owner, 'i');
    let regexText = new RegExp(program.text, 'i');
    let regexType = new RegExp(program.type, 'i');
    let regexEpic = new RegExp(program.epic, 'i');

    return stories.map(story => {
        story.project = projectsById[story.project_id];
        story.state = wf.states
            .filter(s => s.id === story.workflow_state_id)[0];
        story.epic = epics.filter(s => s.id === story.epic_id)[0];
        story.owners = members.filter(m => story.owner_ids.indexOf(m.id) > -1);
        return story;
    }).filter(s => {
        if (!program.archived && s.archived) {
            return false;
        }
        if (!(s.labels
            .map(l => `${l.id},${l.name}`).join(',') + '')
            .match(regexLabel)) {
            return false;
        }
        if (!(s.workflow_state_id + ' ' + (s.state || {}).name)
            .match(regexState)) {
            return false;
        }
        if (!(s.epic_id + ' ' + (s.epic || {}).name)
            .match(regexEpic)) {
            return false;
        }
        if (program.owner) {
            const owned = s.owners.filter(o => {
                return !!`${o.profile.name} ${o.profile.mention_name}`
                    .match(regexOwner);
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
        return true;
    });
};

const sortStories = (program) => {
    const fields = (program.sort || '')
        .split(',')
        .map(s => {
            return s.split(':')
                .map(ss => ss.split('.'));
        });
    const pluck = (acc, val) => {
        if (acc[val] === undefined)
            return {};
        return acc[val];
    };
    debug('sorting stories');
    return (a, b) => {
        return fields.reduce((acc, field) => {
            if (acc !== 0)
                return acc;
            const ap = field[0].reduce(pluck, a);
            const bp = field[0].reduce(pluck, b);
            if (ap === bp)
                return 0;
            const direction = (field[1] || [''])[0].match(/des/i) ? 1 : -1;
            if (ap > bp) {
                if (direction > 0)
                    return -1;
            } else {
                if (direction < 0)
                    return -1;
            }
            return 1;
        }, 0);
    };
};

const printStory = (program) => { return (story) => {
    const defaultFormat = `#%i %t
    \tType:   \t%y/%e
    \tProject:\t%p
    \tEpic:   \t%E
    \tOwners: \t%o
    \tState:  \t%s
    \tLabels: \t%l
    \tURL:    \t%u
    \tCreated:\t%c\tUpdated: %u
    \tArchived:\t%a
    `;
    const format = program.format || defaultFormat;
    const labels = story.labels.map(l => {
        return chalk.bold(`#${l.id}`) + ` ${l.name}`;
    });
    const owners = story.owners.map(o => {
        return `${o.profile.name} (` + chalk.bold(`${o.profile.mention_name}` + ')');
    });
    log(format
        .replace(/%i/, chalk.blue.bold(`${story.id}`))
        .replace(/%t/, chalk.blue(`${story.name}`))
        .replace(/%d/, story.description || '')
        .replace(/%y/, story.story_type)
        .replace(/%e/, story.estimate || '_')
        .replace(/%l/, labels.join(', ') || '_')
        .replace(/%E/, chalk.bold(`#${story.epic_id}`) + ` ${(story.epic || {}).name}`)
        .replace(/%p/, chalk.bold(`#${story.project.id}`) + ` ${story.project.name}`)
        .replace(/%o/, owners.join(', ') || '_')
        .replace(/%s/, chalk.bold(`#${story.workflow_state_id} `) + `${(story.state || {}).name}`)
        .replace(/%u/, `https://app.clubhouse.io/story/${story.id}`)
        .replace(/%c/, story.created_at)
        .replace(/%u/, story.updated_at !== story.created_at ? story.updated_at : '_')
        .replace(/%a/, story.archived)
    );
    return story;
};};

const parseDateComparator = (arg) => {
    const match = arg.match(/[0-9].*/) || { index: 0, '0': { length: 30 } };
    const parsedDate = new Date(arg.slice(match.index));
    const comparator = arg.slice(0, match.index);
    return (date) => {
        switch(comparator) {
        case '<':
            return new Date(date) < parsedDate;
        case '>':
            return new Date(date) > parsedDate;
        case '=':
        default:
            return new Date(date.slice(0, match[0].length)).getTime()
                === parsedDate.getTime();
        }
    };
};

const checkoutStoryBranch = (story, prefix) => {
    prefix = prefix || `${config.mentionName}/ch${story.id}/${story.story_type}-`;
    let slug = story.name.toLowerCase()
        .replace(/\s/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 30)
        .replace(/-$/, '');
    const branch = `${prefix}${slug}`;
    debug('checking out git branch: ' + branch);
    execSync('git checkout -b ' + branch);
};

module.exports = {
    listStories,
    printStory,
    checkoutStoryBranch
};
