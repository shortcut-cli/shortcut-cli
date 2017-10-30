const chalk   = require('chalk');
const client  = require('./client.js');
const log     = console.log;
var wfs       = [];
var projects  = [];
var members   = [];
var wf        = { states: [] };

const listStories = async (program) => {
    [ wfs, members, projects ] = await Promise.all([
        client.listWorkflows(),
        client.listMembers(),
        client.listProjects()
    ]);
    wf = wfs[0];    // TODO: this is always getting the default workflow
    const filteredProjects = projects
        .filter(p => {
            return !!(p.id + p.name).match(new RegExp(program.project, 'i'));
        });
    var stories = await Promise.all(filteredProjects.map(fetchStories));
    return stories.map(filterStories(program, filteredProjects))
        .reduce((a, b) => {
            return a.concat(b);
        }, []);
};
const fetchStories = async (project) => {
    return client.listStories(project.id);
};
const filterStories = (program, projects) => { return (stories, index) => {
    const project = projects[index];
    const filtered = stories.map(story => {
        story.project = project;
        story.state = wf.states
            .filter(s => s.id === story.workflow_state_id)[0];
        return story;
    }).map(story => {
        story.owners = members.filter(m => {
            return story.owner_ids.indexOf(m.id) > -1;
        });
        return story;
    }).filter(s => {
        if (!(s.labels
            .map(l => `${l.id},${l.name}`).join(',') + '')
            .match(new RegExp(program.label, 'i'))) {
            return false;
        }
        if (!(s.workflow_state_id + ' ' + s.state.name)
            .match(new RegExp(program.state, 'i'))) {
            return false;
        }
        if (program.owner) {
            const ownerMatch = new RegExp(program.owner, 'i');
            return s.owners.filter(o => {
                return !!`${o.profile.name} ${o.profile.mention_name}`
                    .match(ownerMatch);
            }).length > 0;
        }
        if (!s.name.match(new RegExp(program.text, 'i'))) {
            return false;
        }
        if (!s.story_type.match(new RegExp(program.type, 'i'))) {
            return false;
        }
        if (!program.archived && s.archived) {
            return false;
        }
        return true;
    });
    return filtered;
};};

const printStory = (program) => { return (story) => {
    if (program.idonly) {
        return log(story.id);
    }
    const labels = story.labels.map(l => {
        return chalk.bold(`#${l.id}`) + ` ${l.name}`;
    });
    const owners = story.owners.map(o => {
        return `${o.profile.name} (` + chalk.bold(`${o.profile.mention_name}` + ')');
    });
    log(chalk.blue.bold(`#${story.id}`) + chalk.blue(` ${story.name}`));
    log(`  Type:    ${story.story_type}/${story.estimate || '_'}`);
    log(`  Label:   ${labels.join(', ')}`);
    log('  Project: ' + chalk.bold(`#${story.project.id}`) + ` ${story.project.name}`);
    log('  Owners:  ' + `${owners.join(', ') || '_'}`);
    log('  State:   ' + chalk.bold(`#${story.workflow_state_id} `) + story.state.name);
    log(`  URL:     https://app.clubhouse.io/story/${story.id}`);
    if (story.archived) {
        log('  archived: ' + chalk.bold(story.archived));
    }
    log();
    return story;
};};


module.exports = {
    listStories,
    printStory,
};
