#!/usr/bin/env node
import client from '../lib/client';
import spinner from '../lib/spinner';
const spin = spinner('Loading... %s ');
const log = console.log;
import * as commander from 'commander';
import { Member } from 'clubhouse-lib';
import chalk from 'chalk';

const program = commander
    .description('Display members available for stories')
    .option('-s, --search [query]', 'List members with name containing query', '')
    .option('-d, --disabled', 'List members including disabled', '')
    .parse(process.argv);

const main = async () => {
    spin.start();
    const members = await client.listMembers();
    spin.stop(true);
    const ownerMatch = new RegExp(program.search, 'i');
    members
        .filter((o: Member) => {
            return !!`${o.profile.name} ${o.profile.mention_name}`.match(ownerMatch);
        })
        .map(printMember);
};

const printMember = (member: Member) => {
    if (member.disabled && !program.disabled) return;
    log(chalk.bold(`#${member.id}`));
    log(chalk.bold('Name:          ') + ` ${member.profile.name}`);
    log(chalk.bold('Mention Name:  ') + ` ${member.profile.mention_name}`);
    log(chalk.bold('Role:          ') + ` ${member.role}`);
    log(chalk.bold('Email:         ') + ` ${member.profile.email_address}`);
    if (member.disabled) {
        log(chalk.bold('Disabled:      ') + ` ${member.disabled}`);
    }
    log();
};
main();
