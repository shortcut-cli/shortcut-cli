#!/usr/bin/env node
const { exec } = require('child_process');
const client = require('../lib/client.js');
const spin = require('../lib/spinner.js')();
const storyLib = require('../lib/stories.js');
const log = console.log;
const program = require('commander')
    .usage('[options]')
    .description('create a story with provided details')
    .option('-d, --description [text]', 'Set description of story', '')
    .option('-e, --estimate [number]', 'Set estimate of story')
    .option('-E, --epic [id|name]', 'Set epic of story')
    .option(
        '--git-branch',
        'Checkout git branch from story slug <mention-name>/ch<id>/<type>-<title>\n' +
            '\t\t\t\tas required by the Git integration: https://bit.ly/2RKO1FF'
    )
    .option('-I, --idonly', 'Print only ID of story result')
    .option('-l, --label [id|name]', 'Stories with label id/name, by regex', '')
    .option('-o, --owners [id|name]', 'Set owners of story, comma-separated', '')
    .option('-O, --open', 'Open story in browser')
    .option('-p, --project [id|name]', 'Set project of story, required', '')
    .option('-t, --title [text]', 'Set title of story, required', '')
    .option('-s, --state [id|name]', 'Set workflow state of story', '')
    .option('-y, --type [name]', 'Set type of story, default: feature', 'feature')
    .parse(process.argv);

const main = async () => {
    const entities = await storyLib.fetchEntities();
    if (!program.idonly) spin.start();
    let update = {
        name: program.title,
        story_type: program.type,
        description: program.description,
        estimate: program.estimate || undefined,
    };
    if (program.project) {
        update.project_id = (storyLib.findProject(entities, program.project) || {}).id;
    }
    if (program.state) {
        update.workflow_state_id = (storyLib.findState(entities, program.state) || {}).id;
    }
    if (program.epic) {
        update.epic_id = (storyLib.findEpic(entities, program.epic) || {}).id;
    }
    if (program.estimate) {
        update.estimate = parseInt(program.estimate, 10);
    }
    if (program.owners) {
        update.owner_ids = storyLib.findOwnerIds(entities, program.owners);
    }
    if (program.label) {
        update.labels = storyLib.findLabelNames(entities, program.label);
    }
    let story = false;
    if (!update.name || !update.project_id) {
        if (!program.idonly) spin.stop(true);
        log('Must provide --title and --project');
    } else {
        try {
            story = await client.createStory(update);
        } catch (e) {
            log('Error creating story');
        }
    }
    if (!program.idonly) spin.stop(true);
    if (story) {
        story = storyLib.hydrateStory(entities, story);
        storyLib.printDetailedStory(story);
        if (program.gitBranch) {
            storyLib.checkoutStoryBranch(story);
        }
        if (program.open) {
            exec('open ' + storyLib.storyURL(story));
        }
    }
};

main();
