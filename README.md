# shortcut-cli

[![Version](https://badge.fury.io/js/@shortcut-cli%2Fshortcut-cli.svg)](https://badge.fury.io/js/@shortcut-cli%2Fshortcut-cli)
[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/shortcut-cli/shortcut-cli/blob/main/LICENSE)
[![PRs welcome!](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()

This is a community-driven command line interface for [Shortcut](https://shortcut.com), focused on the display and manipulation of stories. With this, you can run custom searches, save them as local workspaces, and recall those workspaces. You can also view full stories, update most attributes on a story, and create brand new stories quickly.

## Table of Contents

- [Usage & Commands](#usage)
    - [Install](#install)
    - [Search](#search)
    - [Story](#story)
    - [Story Creation](#story-creation)
    - [Workspace](#workspace)
    - [Members](#members)
    - [Epics](#epics)
    - [Docs](#docs)
    - [Workflows](#workflows)
    - [Projects](#projects)
    - [API](#api)
- [Development](#development)
- [Acknowledgments](#acknowledgments)

## Usage

### Install

Install via npm:

```sh
npm install @shortcut-cli/shortcut-cli -g
short install
```

```
  Usage: short install [options]

  Install access token for Shortcut API


  Options:

    -V, --version  output the version number
    -f, --force    Force install/reinstall
    -h, --help     output usage information
```

You may also provide a Shortcut API token via environment variable `SHORTCUT_API_TOKEN`.

```sh
SHORTCUT_API_TOKEN=foobar short story 3300
```

To skip `short install` entirely, set the additional environment variables used for URL and mention-name substitutions:

- `SHORTCUT_URL_SLUG` – your workspace slug, e.g. `acme-co`
- `SHORTCUT_MENTION_NAME` – your personal mention name used in branches, e.g. `mike`

With these env vars in place you can run commands directly:

```sh
SHORTCUT_API_TOKEN=foobar \
SHORTCUT_URL_SLUG=acme-co \
SHORTCUT_MENTION_NAME=mike \
short story 3300
```

```
  Usage: short [options] [command]

  A command line tool for searching, viewing, and updating shortcut.com stories


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
    docs            list and search docs
    doc             view, create, update, or delete a doc
    projects        list or search projects
    workspace       list stories matching saved workspace query
    api             make a request to the Shortcut API
    help [cmd]      display help for [cmd]
```

### Search

```
  Usage: short find [options] [SEARCH OPERATORS]

  Search through Shortcut stories. Arguments (non-flag/options) will
  be passed to Shortcut story search API as search operators. Passing '%self%' as
  a search operator argument will be replaced by your mention name. Note that passing search
  operators and options (e.g. --owner foobar) will use the options as extra filtering
  in the client.

  Refer to https://help.shortcut.com/hc/en-us/articles/360000046646-Search-Operators
  for more details about search operators.


  Options:

    -a, --archived                      Include archived Stories
    -c, --created [operator][date]      Stories created within criteria (operator is one of <|>|=)
    -q, --quiet                         Print only story output, no loading dialog
    -l, --label [id|name]               Stories with label id/name, by regex
    -o, --owner [name]                  Stories with owner, by regex
    -p, --project [id]                  Stories in project
    -s, --state [id|name]               Stories in workflow state id/name, by regex
    -e, --estimate [operator][number]   Stories estimated within criteria (operator is one of <|>|=)
    --epic [id|name]                    Stories in epic id/name, by regex
    -i, --iteration [id|name]           Stories in iteration id/name, by regex
    -S, --save [name]                   Save search configuration as workspace
    -t, --text [name]                   Stories with text in name, by regex
    -u, --updated [operator][date]      Stories updated within criteria (operator is one of <|>|=)
    -y, --type [name]                   Stories of type, by regex
    -r, --sort [field]                  Sort stories by field (accessor[:asc|desc][,next])
    -f, --format [template]             Format each story output by template
    -h, --help                          output usage information
```

Example output

```
short search -o 'josh' -s 'Review'
#1480 Create Thinga-ma-bob
  Type:      feature/3
  Label:     #512 client_web
  Epic:      #5 Things to do
  Iteration: #52 Spaghetti
  Project:   #14 Customers
  Owners:    Josh (josh)
  State:     #500000020 Code Review
  URL:       https://app.shortcut.com/story/1480

# Custom formatting is an option
short search -o 'josh' -s 'Review' -f $'%i\t%s\t%t\n\t%o'
1480    Code Review (#500000020)  Create Thinga-ma-bob
    Josh (josh)
```

#### Story Output Formatting

Templating variables:

```
%id      Print ID of story
%t       Print title/name of story
%a       Print archived status of story
%T       Print the team name
%o       Print owners of story
%r       Print the requester
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
%gbs     Print Git integration branch short name
```

Note that the `$` string operator in bash is helpful in allowing `\t` (tab) and `\n` (newline) literals in the formatting string. Otherwise, you can actually just type a newline character.

#### Story Output Sorting

The default sorting for stories found is `state.position:asc,position:asc`, which translates to "sort by associated state position ascending, then by story position ascending within the same state."

### Story

```
  Usage: short story [options] <id>

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
```

Example output:

```
short story 1480 -c 'This is a commend' -o josh
#1480 Create Thinga-ma-bob
Desc:    Create a thing to display:
Owners:  Josh (josh)
Type:    feature/3
Label:   #512 client_web
Project: #14 Customer
State:   #500000020 Code Review
URL:     https://app.shortcut.com/story/1480
Comment: This is a comment
         Josh at: 2017-10-25T16:17:04Z
```

### Story Creation

```
  Usage: short create [options]

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
    -p, --project [id|name]   Set project of story, required if --state is not set
    -T, --team [id|name]      Set team of story
    -t, --title [text]        Set title of story, required
    -s, --state [id|name]     Set workflow state of story, required if --project is not set
    -y, --type [name]         Set type of story, default: feature
    -h, --help                output usage information
    --git-branch              Checkout git branch from story slug <mention-name>/ch<id>/<type>-<title>
                              as required by the Git integration: https://bit.ly/2RKO1FF
    --git-branch-short        Checkout git branch from story slug <mention-name>/ch<id>/<title>
```

### Workspace

```
  Usage: short workspace [NAME] [options]

  List stories matching saved workspace query


  Options:

    -l, --list          List saved workspaces
    -n, --name [name]   Load named workspace
    -u, --unset [name]  Force unset saved workspace
    -q, --quiet         Print only resulting story output, no loading dialog
    -h, --help          output usage information
```

### Members

```
  Usage: short members [options]

  Display members available for stories


  Options:

    -s, --search [query]  List members with name containing query
    -d, --disabled        List members including disabled
    -h, --help            output usage information
```

### Epics

```
  Usage: short epics [options]

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
```

#### Epic Creation

```
  Usage: short epic create [options]

  create a new epic


  Options:

    -n, --name [text]          Set name of epic, required
    -d, --description [text]   Set description of epic
    -s, --state [name]         Set state of epic (to do, in progress, done)
    --deadline [date]          Set deadline for epic (YYYY-MM-DD)
    --planned-start [date]     Set planned start date (YYYY-MM-DD)
    -o, --owners [id|name]     Set owners of epic, comma-separated
    -T, --team [id|name]       Set team of epic
    -l, --label [id|name]      Set labels of epic, comma-separated
    -I, --idonly               Print only ID of epic result
    -O, --open                 Open epic in browser
    -h, --help                 output usage information
```

#### Epic Output Formatting

Templating variables:

```
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
```

### Docs

```
  Usage: short docs [options]

  List and search Shortcut Docs. By default, lists all docs you have access to.
  Use --title to search docs by title.


  Options:

    -a, --archived      Search for archived docs (requires --title)
    -m, --mine          Search for docs created by me (requires --title)
    -f, --following     Search for docs I am following (requires --title)
    -t, --title [text]  Search docs by title (required for search filters)
    -q, --quiet         Print only doc output, no loading dialog
    -I, --idonly        Print only IDs of doc results
    -h, --help          output usage information
```

#### Doc View, Create, Update, Delete

```
  Usage: short doc [command] [options]

  view, create, or update a doc


  Commands:

    view [options] <id>    view a doc by ID
    create [options]       create a new doc
    update [options] <id>  update an existing doc
    delete [options] <id>  delete a doc
```

View a doc:

```
  Usage: short doc view <id> [options]

  Options:

    --html       Include HTML content in output
    -O, --open   Open doc in browser
    -q, --quiet  Print only doc content, no metadata
    -h, --help   output usage information
```

You can also view a doc directly by ID: `short doc <uuid>`

Create a doc:

```
  Usage: short doc create [options]

  Options:

    -t, --title <text>    Set title of doc (required)
    -c, --content <text>  Set content of doc (required)
    --markdown            Treat content as markdown (default is HTML)
    -I, --idonly          Print only ID of doc result
    -O, --open            Open doc in browser
    -h, --help            output usage information
```

Update a doc:

```
  Usage: short doc update <id> [options]

  Options:

    -t, --title <text>    Update title of doc
    -c, --content <text>  Update content of doc
    --markdown            Treat content as markdown (default is HTML)
    -O, --open            Open doc in browser
    -h, --help            output usage information
```

Delete a doc:

```
  Usage: short doc delete <id> [options]

  Options:

    --confirm   Confirm deletion (required)
    -h, --help  output usage information
```

### Workflows

```
  Usage: short workflows [options]

  Display workflows/states available for stories


  Options:

    -s, --search [query]  List states containing query
    -h, --help            output usage information
```

### Projects

```
  Usage: short projects [options]

  Display projects available for stories


  Options:

    -a, --archived       List only projects including archived
    -d, --detailed       List more details for each project
    -t, --title [query]  List projects with name/title containing query
    -h, --help           output usage information
```

### API

```
  Usage: short api <path> [options]

  Make a request to the Shortcut API.


  Options:

    -X, --method <method>      The HTTP method to use. (default: "GET")
    -H, --header <header>      Add a header to the request (e.g., "Content-Type: application/json"). Can be specified multiple times.
    -f, --raw-field <key=value>  Add a string parameter. Can be specified multiple times.
    -h, --help                 output usage information


  Examples:
    $ short api /search/iterations -f page_size=10 -f query=123
    $ short api /stories -X POST -f 'name=My new story' -f project_id=123
    # jq can be used to shorten the response output.
    $ short api /search/iterations -f page_size=10 -f query=123 | jq '.data[] | {id, name}'
```

## Development

You can use TypeScript watcher which will recompile your code automatically:

```sh
npm run build:watch
```

You can run shortcut-cli with TypeScript map enabled:

```sh
npm start -- story 1234
```

## Acknowledgments

- [Repository for this code](https://github.com/shortcut-cli/shortcut-cli)
- [NPM registry for this code](https://www.npmjs.com/package/@shortcut-cli/shortcut-cli)
- [Shortcut API](https://shortcut.com/api/rest/v3)
- Official [@shortcut/client](https://github.com/useshortcut/shortcut-client-js)
- [joshbeckman](https://github.com/joshbeckman), [j-martin](https://github.com/j-martin), [joshmfrankel](https://github.com/joshmfrankel), and [ohe](https://github.com/ohe) who created and contributed to this project

## Contributors

<a href="https://github.com/shortcut-cli/shortcut-cli/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=shortcut-cli/shortcut-cli" />
</a>
