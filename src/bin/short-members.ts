#!/usr/bin/env node
import type { Member } from '@shortcut/client';
import chalk from 'chalk';
import { Command } from 'commander';

import client from '../lib/client';
import spinner from '../lib/spinner';

interface MembersOptions {
    search?: string;
    disabled?: boolean;
}

const spin = spinner('Loading... %s ');
const log = console.log;

const program = new Command()
    .description('Display members available for stories')
    .option('-s, --search [query]', 'List members with name containing query', '')
    .option('-d, --disabled', 'List members including disabled', '')
    .parse(process.argv);

const opts = program.opts<MembersOptions>();

const main = async () => {
    spin.start();
    const members = await client.listMembers(null).then((r) => r.data);
    spin.stop(true);
    const ownerMatch = new RegExp(opts.search ?? '', 'i');
    members
        .filter((o: Member) => {
            return !!`${o.profile.name} ${o.profile.mention_name}`.match(ownerMatch);
        })
        .map(printMember);
};

const printMember = (member: Member) => {
    if (member.disabled && !opts.disabled) return;
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
