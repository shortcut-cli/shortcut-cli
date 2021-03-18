#!/usr/bin/env node
import storyLib, { StoryHydrated } from '../lib/stories';

import { exec } from 'child_process';

import client from '../lib/client';

import { Epic, Iteration, Project, Story, WorkflowState } from 'clubhouse-lib';
import spinner from '../lib/spinner';
import * as commander from 'commander';
import { loadConfig } from '../lib/configure';

const inquirer = require('inquirer');
const chalk = require('chalk');

const config = loadConfig();
const spin = spinner();
const log = console.log;
const program = commander
    .usage('[options]')
    .description('create a story with provided details')
    .option('-d, --description [text]', 'Set description of story', '')
    .option('-e, --estimate [number]', 'Set estimate of story')
    .option('--epic [id|name]', 'Set epic of story')
    .option(
        '--git-branch',
        'Checkout git branch from story slug <mention-name>/ch<id>/<type>-<title>\n' +
        '\t\t\t\tas required by the Git integration: https://bit.ly/2RKO1FF'
    )
    .option(
        '--git-branch-short',
        'Checkout git branch from story slug <mention-name>/ch<id>/<title>'
    )
    .option('-i, --iteration [id|name]', 'Set iteration of story')
    .option('-I, --idonly', 'Print only ID of story result')
    .option('-l, --label [id|name]', 'Stories with label id/name, by regex', '')
    .option('-o, --owners [id|name]', 'Set owners of story, comma-separated', '')
    .option('-O, --open', 'Open story in browser')
    .option('-p, --project [id|name]', 'Set project of story, required', '')
    .option('-t, --title [text]', 'Set title of story, required', '')
    .option('-s, --state [id|name]', 'Set workflow state of story', '')
    .option('-y, --type [name]', 'Set type of story, default: feature', 'feature')
    .option('--interactive', 'Create story with interactive mode')
    .parse(process.argv);

const main = async () => {
    const entities = await storyLib.fetchEntities();

    if (program.interactive) {

        inquirer.prompt([
            {
                type: 'input',
                name: 'title',
                message: "Story Title:",
            },
            {
                type: 'list',
                name: 'type',
                message: 'Story type:',
                choices: [
                    {
                        name: "Feature",
                        value: "feature"
                    },
                    {
                        name: "Bug",
                        value: "bug"
                    },
                    {
                        name: "Chore",
                        value: "chore"
                    }
                ],
                default: "feature"
            },
            {
                type: 'rawlist',
                name: 'project',
                message: "Select a project:",
                choices: () => Object.keys(entities.projectsById).map(id => ({ name: entities.projectsById[id].name, value: id })),
                loop: false,
                pageSize: 15
            },
            {
                type: 'confirm',
                name: 'ask_desc',
                message: "Do you want to provide a description?",
            },
            {
                type: 'editor',
                name: 'description',
                message: "Description:",
                when: (answers: any) => answers.ask_desc
            },
            {
                type: 'list',
                name: 'details',
                message: "Do you want to submit now or provide more details?",
                choices: [{ name: 'Submit', value: false }, { name: 'More informations', value: true }],
            },
            {
                type: 'list',
                name: 'state',
                message: "Story state:",
                choices: async (answers: any) => {
                    const workflows = await client.listWorkflows();
                    const workflow = workflows.find(wkf => wkf.project_ids.includes(parseInt(answers.project)));
                    return workflow.states.map(state => ({ name: state.name, value: state.id }));
                },
                when: (answers: any) => answers.details
            },
            {
                type: 'list',
                name: 'epic',
                message: "Story epic:",
                choices: () => [{ name: "No Epic", value: null }, ...Object.keys(entities.epicsById).map(id => ({ name: entities.epicsById[id].name, value: id }))],
                when: (answers: any) => answers.details
            },
            {
                type: 'list',
                name: 'iteration',
                message: "Story Iteration:",
                choices: () => [{ name: "No Iterations", value: null }, ...Object.keys(entities.iterationsById).map(id => ({ name: entities.iterationsById[id].name, value: id }))],
                when: (answers: any) => answers.details
            },
            {
                type: 'confirm',
                name: 'ask_owner',
                message: "Does the story have owners?",
                when: (answers: any) => answers.details
            },
            {
                type: 'checkbox',
                name: 'owner',
                message: "Story Owner:",
                choices: () => Object.keys(entities.membersById).map(id => ({ name: entities.membersById[id].profile.name, value: id })),
                when: (answers: any) => answers.details && answers.ask_owner
            },
            {
                type: 'confirm',
                name: 'ask_labels',
                message: "Do you want to add labels?",
                when: (answers: any) => answers.details
            },
            {
                type: 'checkbox',
                name: 'label',
                message: "Story Labels:",
                choices: () => entities.labels.filter(label => !label.archived).map(label => ({ name: label.name, value: label.id })),
                when: (answers: any) => answers.details && answers.ask_labels,
                loop: false,
                pageSize: 15
            },
            {
                type: 'number',
                name: 'estimate',
                message: "Story Estimate:",
                when: (answers: any) => answers.details
            },
        ]).then(async (aws: any) => {

            spin.start();

            let data = {
                name: aws.title,
                story_type: aws.type,
                description: aws.description ? `${aws.description}` : '',
                iteration_id: parseInt(aws.iteration) || null,
                project_id: parseInt(aws.project),
                owner_ids: aws.owner || [],
                labels: aws.label ? storyLib.findLabelNames(entities, aws.label.join(",")) : [],
                epic_id: parseInt(aws.epic) || null,
                estimate: parseInt(aws.estimate) || null
            } as Story;

            if (aws.state) {
                data.workflow_state_id = parseInt(aws.state);
            }

            let story: StoryHydrated;

            try {
                story = await client.createStory(data);
            } catch (e) {
                log(chalk.red('Error creating story'));
            }
            spin.stop(true);
            if (story) {
                story = storyLib.hydrateStory(entities, story);
                storyLib.printDetailedStory(story);
            }
        });

    } else {

        if (!program.idonly) spin.start();
        let update = {
            name: program.title,
            story_type: program.type,
            description: `${program.description}`,
            estimate: program.estimate || undefined,
        } as Story;
        if (program.project) {
            update.project_id = (storyLib.findProject(entities, program.project) || ({} as Project)).id;
        }
        if (program.state) {
            update.workflow_state_id = (
                storyLib.findState(entities, program.state) || ({} as WorkflowState)
            ).id;
        }
        if (program.epic) {
            update.epic_id = (storyLib.findEpic(entities, program.epic) || ({} as Epic)).id;
        }
        if (program.iteration) {
            update.iteration_id = (
                storyLib.findIteration(entities, program.iteration) || ({} as Iteration)
            ).id;
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
        let story: StoryHydrated;
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
            } else if (program.gitBranchShort) {
                storyLib.checkoutStoryBranch(story, `${config.mentionName}/ch${story.id}/`);
            }
            if (program.open) {
                exec('open ' + storyLib.storyURL(story));
            }
        }
    }
};

main();
