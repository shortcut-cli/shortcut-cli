# clubhouse-cli

[![CircleCI](https://circleci.com/gh/andjosh/clubhouse-cli.svg?style=svg)](https://circleci.com/gh/andjosh/clubhouse-cli)

This is a command line interface for [Clubhouse](https://app.clubhouse.io), focused on the display and manipulation of stories. With this, you can run custom searches, save them as local workspaces, and recall those workspaces. You can also view full stories, update most attributes on a story, and create brand new stories quickly.

## Table of Contents
- [Usage & Commands](#usage)
    - [Search](#search)
    - [Story](#story)
    - [Story Creation](#story-creation)
    - [Workspace](#workspace)
    - [Members](#members)
    - [Epics](#epics)
    - [Workflows](#workflows)
    - [Projects](#projects)
    - [Install](#install)
    - [Developement](#developement)
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
    search          search stories with optional query
    members         list members
    story           view or manipulate a story or stories
    create          create a story
    workflows       list workflows and their states
    epics           list epics and their states
    projects        list or search projects
    workspace       list stories matching saved workspace query
    help [cmd]      display help for [cmd]
~~~

### Search

~~~
  Usage: club-find [options] [SEARCH OPERATORS]

  Search through clubhouse stories. Arguments (non-flag/options) will
  be passed to Clubhouse story search API as search operators. Passing '%self%' as
  a search operator argument will be replaced by your mention name. Note that passing search
  operators and options (e.g. --owner foobar) will use the options as extra filtering
  in the client.

  Refer to https://help.clubhouse.io/hc/en-us/articles/360000046646-Search-Operators
  for more details about search operators.


  Options:

    -a, --archived                  Include archived Stories
    -c, --created [operator][date]  Stories created within criteria (operator is one of <|>|=)
    -q, --quiet                     Print only story output, no loading dialog
    -l, --label [id|name]           Stories with label id/name, by regex
    -o, --owner [name]              Stories with owner, by regex
    -p, --project [id]              Stories in project
    -s, --state [id|name]           Stories in workflow state id/name, by regex
    --epic [id|name]                Stories in epic id/name, by regex
    -i, --iteration [id|name]       Stories in iteration id/name, by regex
    -S, --save [name]               Save search configuration as workspace
    -t, --text [name]               Stories with text in name, by regex
    -u, --updated [operator][date]  Stories updated within criteria (operator is one of <|>|=)
    -y, --type [name]               Stories of type, by regex
    -r, --sort [field]              Sort stories by field (accessor[:asc|desc][,next])
    -f, --format [template]         Format each story output by template
    -h, --help                      output usage information
~~~

Example output

~~~
$ club search -o 'josh' -s 'Review'
#1480 Create Thinga-ma-bob
  Type:      feature/3
  Label:     #512 client_web
  Epic:      #5 Things to do
  Iteration: #52 Spaghetti
  Project:   #14 Customers
  Owners:    Josh (josh)
  State:     #500000020 Code Review
  URL:       https://app.clubhouse.io/story/1480

# Custom formatting is an option
$ club search -o 'josh' -s 'Review' -f $'%i\t%s\t%t\n\t%o'
1480    Code Review (#500000020)  Create Thinga-ma-bob
    Josh (josh)
~~~

#### Story Output Formatting

Templating variables:

~~~
%id      Print ID of story
%t       Print title/name of story
%a       Print archived status of story
%o       Print owners of story
%l       Print labels on story
%u       Print URL of story
%epic    Print epic of story
%i       Print iteration of story
%p       Print project of story
%y       Print story type
%e       Print story estimate
%s       Print story state
%c       Print story creation timestamp
%updated Print story updated timestamp (if different from created)
%j       Print full story as formatted JSON
%gb      Print Git integration branch name
%gbs     Pring Git integration branch short name
~~~

Note that the `$` string operator in bash is helpful in allowing `\t` (tab) and `\n` (newline) literals in the formatting string. Otherwise, you can actually just type a newline character.

#### Story Output Sorting

The default sorting for stories found is `state.position:asc,position:asc`, which translates to "sort by associated state position ascending, then by story position ascending within the same state."

### Story

~~~
  Usage: club story [options] <id>

  Update and/or display story details


  Options:

    -I, --idonly              Print only ID of story results
    -s, --state [id|name]     Update workflow state of story
    -e, --estimate [number]   Update estimate of story
    -d, --description [text]  Update description of story
    -D, --download            Download all attached files
    --download-dir [path]     Directory to download files to
    --epic [id|name]          Update epic of story
    -i, --iteration [id|name] Update iteration of story
    -f, --format [template]   Format story output by template
    --from-git                Fetch story parsed by ID in current git branch
    --git-branch              Checkout git branch from story slug <mention-name>/ch<id>/<type>-<title>
                                as required by the Git integration: https://bit.ly/2RKO1FF
    --git-branch-short        Checkout git branch from story slug <mention-name>/ch<id>/<title>
    -l, --label [id|name]     Update story with labels, comma-separated
    --move-after [id]         Move story to position below story ID
    --move-before [id]        Move story to position above story ID
    --move-down [n]           Move story position downward by n stories
    --move-up [n]             Move story position upward by n stories
    -c, --comment [text]      Add comment to story
    -o, --owners [id|name]    Update owners of story, comma-separated
    -O, --open                Open story in browser
    --oe, --open-epic         Open story's epic in browser
    --oi, --open-iteration    Open story's iteration in browser
    --op, --open-project      Open story's project in browser
    -q, --quiet               Print only story output, no loading dialog
    -t, --title [text]        Update title of story
    --task [text]             Create new task on story
    --task-complete [text]    Toggle completion of story task matching text
    -y, --type [name]         Set type of story
    -h, --help                output usage information
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
    --epic [id|name]          Set epic of story
    -i, --iteration [id|name] Set iteration of story
    -I, --idonly              Print only ID of story result
    -l, --label [id|name]     Stories with label id/name, by regex
    -o, --owners [id|name]    Set owners of story, comma-separated
    -O, --open                Open story in browser
    -p, --project [id|name]   Set project of story, required
    -t, --title [text]        Set title of story, required
    -s, --state [id|name]     Set workflow state of story
    -y, --type [name]         Set type of story, default: feature
    -h, --help                output usage information
    --git-branch              Checkout git branch from story slug <mention-name>/ch<id>/<type>-<title>
                              as required by the Git integration: https://bit.ly/2RKO1FF
    --git-branch-short        Checkout git branch from story slug <mention-name>/ch<id>/<title>
~~~

### Workspace

~~~
  Usage: club workspace [NAME] [options]

  List stories matching saved workspace query


  Options:

    -l, --list          List saved workspaces
    -n, --name [name]   Load named workspace
    -u, --unset [name]  Force unset saved workspace
    -q, --quiet         Print only resulting story output, no loading dialog
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

### Epics

~~~
  Usage: club epics [options]

  Display epics available for stories


  Options:

    -a, --archived            List only epics including archived
    -c, --completed           List only epics that have been completed
    -d, --detailed            List more details for each epic
    -f, --format [template]   Format epic output by template
    -M, --milestone [ID]      List only epics with the given milestone ID
    -t, --title [query]       List epics with name/title containing query
    -s, --started             List epics that have been started
    -h, --help                output usage information
~~~

#### Epic Output Formatting

Templating variables:

~~~
%id      Print ID of epic
%t       Print title/name of epic
%m       Print milestone of epic
%s       Print epic state
%dl      Print epic deadline
%d       Print epic description
%p       Print epic total points
%ps      Print epic total points started
%pd      Print epic total points done
%c       Print epic total completion percentage
%a       Print archived status of epic
%st      Print started status of epic
%co      Print completed status of epic
~~~

### Workflows

~~~
  Usage: club workflows [options]

  Display workflows/states available for stories


  Options:

    -s, --search [query]  List states containing query
    -h, --help            output usage information
~~~

### Projects

~~~
  Usage: club projects [options]

  Display projects available for stories


  Options:

    -a, --archived       List only projects including archived
    -d, --detailed       List more details for each project
    -t, --title [query]  List projects with name/title containing query
    -h, --help           output usage information
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

You may also provide a clubhouse API token via environment variable `CLUBHOUSE_API_TOKEN`.
~~~sh
$ CLUBHOUSE_API_TOKEN=foobar club story 3300
~~~

### Developement

You can use typescript watcher which will recompile your code automatically:

~~~sh
$ npm run build:watch
~~~

You can run clubhouse-cli with typescript map enabled:

~~~sh
$ npm start -- story 1234
~~~

## Acknowledgments

- [Repository for this code](https://github.com/andjosh/clubhouse-cli)
- [NPM registry for this code](https://www.npmjs.com/package/clubhouse-cli)
- [Clubhouse API](http://clubhouse.io/api/rest/v2/)
- Official [clubhouse-lib](https://github.com/clubhouse/clubhouse-lib)

## Contributors
- [andjosh](https://github.com/andjosh)
- [j-martin](https://github.com/j-martin)
