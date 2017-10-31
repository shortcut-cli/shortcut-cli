# clubhouse-cli

This is a command line interface for [Clubhouse](https://app.clubhouse.io), focused on the display and manipulation of stories. With this, you can run custom searches, save them as local workspaces, and recall those workspaces. You can also view full stories, update most attributes on a story, and create brand new stories quickly.

## Table of Contents
- [Usage & Commands](#usage)
    - [Search](#search)
    - [Stories](#stories)
    - [Story Creation](#story-creation)
    - [Workspace](#workspace)
    - [Members](#members)
    - [Workflows](#workflows)
    - [Install](#install)
- [Acknowledgments](#acknowledgments)

## Usage

~~~
  Usage: club [options] [command]

  A command line tool for searching, viewing, and updating clubhouse.io stories


  Options:

    -V, --version  output the version number
    -h, --help     output usage information


  Commands:

    install         install and configure API access
    find            find stories with optional query
    members         list members
    story           view or manipulate a story or stories
    create          create a story
    workflows       list workflows and their states
    workspace       list stories matching saved workspace query
    help [cmd]      display help for [cmd]
~~~

### Search

~~~
  Usage: club find [options]

  Search through clubouse stories


  Options:

    -a, --archived          Include archived Stories
    -I, --idonly            Print only ID of story results
    -l, --label [id|name]   Stories with label id/name, by regex
    -o, --owner [name]      Stories with owner, by regex
    -p, --project [id|name] Stories in project
    -s, --state [id|name]   Stories in workflow state id/name, by regex
    -S, --save [name]       Save search configuration as workspace
    -t, --text [name]       Stories with text in name, by regex
    -y, --type [name]       Stories of type, by regex
    -h, --help              output usage information
~~~

Example output

~~~
$ club find -o 'josh' -s 'Review'
#1480 Create Thinga-ma-bob
  Type:    feature/3
  Label:   #512 client_web
  Project: #14 Customers
  Owners:  Josh (josh)
  State:   #500000020 Code Review
  URL:     https://app.clubhouse.io/story/1480
~~~

### Stories

~~~
  Usage: club story [options] <id>

  Update and/or display story details


  Options:

    -I, --idonly             Print only ID of story results
    -s, --state [id|name]    Update workflow state of story
    -e, --estimate [number]  Update estimate of story
    -E, --epic [id|name]     Update epic of story
    -l, --label [id|name]    Update story with labels, comma-separated
    -c, --comment [text]     Add comment to story
    -o, --owner [id|name]    Update owners of story, comma-separated
    -O, --open               Open story in browser
    -h, --help               output usage information
~~~

Example output:

~~~
$ club story 1480 -c 'This is a commend' -o josh
#1480 Create Thinga-ma-bob
Desc:    Create a thing to display:
Owners:  Josh (josh)
Type:    feature/3
Label:   #512 client_web
Project: #14 Customer
State:   #500000020 Code Review
URL:     https://app.clubhouse.io/story/1480
Comment: This is a commend
         Josh at: 2017-10-25T16:17:04Z
~~~

### Story Creation

~~~
  Usage: club create [options]

  create a story with provided details


  Options:

    -d, --description [text]  Set description of story
    -e, --estimate [number]   Set estimate of story
    -E, --epic [id|name]      Set epic of story
    -I, --idonly              Print only ID of story result
    -l, --label [id|name]     Stories with label id/name, by regex
    -o, --owners [id|name]    Set owners of story, comma-separated
    -O, --open                Open story in browser
    -p, --project [id|name]   Set project of story, required
    -t, --title [text]        Set title of story, required
    -s, --state [id|name]     Set workflow state of story
    -y, --type [name]         Set type of story, default: feature
    -h, --help                output usage information
~~~

### Workspace

~~~
  Usage: club workspace [options]

  List stories matching saved workspace query


  Options:

    -l, --list          List saved workspaces
    -n, --name [name]   Load named workspace
    -u, --unset [name]  Force unset saved workspace
    -h, --help          output usage information
~~~

### Members

~~~
  Usage: club members [options]

  Display members available for stories


  Options:

    -s, --search [query]  List members with name containing query
    -d, --disabled        List members including disabled
    -h, --help            output usage information
~~~

### Workflows

~~~
  Usage: club workflows [options]

  Display workflows/states available for stories


  Options:

    -s, --search [query]  List states containing query
    -h, --help            output usage information
~~~

### Install

Install via npm:

~~~sh
$ npm install clubhouse-cli -g
$ club install
~~~

~~~
  Usage: club install [options]

  Install access token for clubhouse API


  Options:

    -V, --version  output the version number
    -f, --force    Force install/reinstall
    -h, --help     output usage information
~~~

## Acknowledgments

- [Clubhouse API](http://clubhouse.io/api/rest/v2/)
- Official [clubhouse-lib](https://github.com/clubhouse/clubhouse-lib)
