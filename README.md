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
    - [Labels](#labels)
    - [Custom Fields](#custom-fields)
    - [Epics](#epics)
    - [Objectives](#objectives)
    - [Iterations](#iterations)
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
    labels          list labels
    label           view stories for a label
    custom-fields   list custom fields
    custom-field    view a custom field
    story           view or manipulate a story or stories
    create          create a story
    workflows       list workflows and their states
    epics           list epics and their states
    iterations      list iterations
    iteration       view, create, update, or delete an iteration
    objectives      list objectives and their states
    objective       view, create, or update objectives
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
    --deadline [date]         Update due date of story (YYYY-MM-DD)
    --external-link [url]     Add external link to story, comma-separated
    --follower [id|name]      Update followers of story, comma-separated
    -o, --owners [id|name]    Update owners of story, comma-separated
    -O, --open                Open story in browser
    --oe, --open-epic         Open story's epic in browser
    --oi, --open-iteration    Open story's iteration in browser
    --op, --open-project      Open story's project in browser
    -q, --quiet               Print only story output, no loading dialog
    --requester [id|name]     Update requester of story
    -t, --title [text]        Update title of story
    --task [text]             Create new task on story
    --task-complete [text]    Toggle completion of story task matching text
    -y, --type [name]         Set type of story
    -h, --help                output usage information
```

History:

```sh
npx short story history 17
```

Comments:

```sh
npx short story comments 17
```

Tasks:

```sh
npx short story tasks 17
```

Update examples:

```sh
npx short story 17 --deadline 2026-03-31
npx short story 17 --requester test3969 --follower test3969
npx short story 17 --external-link "https://example.com/spec"
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

### Labels

```
  Usage: short labels [options]

  Display labels available for stories and epics


  Options:

    -a, --archived        List labels including archived
    -s, --search [query]  List labels with name containing query
    -h, --help            output usage information
```

```
  Usage: short label [command] [options]

  create labels or view stories for a label


  Commands:

    create             create a new label
    update <idOrName>  update an existing label
    epics <idOrName>   list epics for a label by id or name
    stories <idOrName>  list stories for a label by id or name
```

Create a label:

```
  Usage: short label create [options]

  Options:

    -n, --name [text]         Set name of label, required
    -d, --description [text]  Set description of label
    -c, --color [hex]         Set label color in hex format like #3366cc
    -I, --idonly              Print only ID of label result
    -h, --help                output usage information
```

Update a label:

```
  Usage: short label update <idOrName> [options]

  Options:

    -n, --name [text]         Set name of label
    -d, --description [text]  Set description of label
    -c, --color [hex]         Set label color in hex format like #3366cc
    -a, --archived            Archive label
    -h, --help                output usage information
```

List stories for a label:

```
  Usage: short label stories <idOrName> [options]

  Options:

    -d, --detailed           Show more details for each story
    -f, --format [template]  Format each story output by template
    -h, --help               output usage information
```

List epics for a label:

```
  Usage: short label epics <idOrName>
```

Example:

```sh
npx short labels --search client
npx short label create --name "triage-needed" --color "#3366cc"
npx short label update triage-needed --description "Queue for manual review"
npx short label epics client_web
npx short label stories client_web
```

### Custom Fields

```
  Usage: short custom-fields [options]

  Display custom fields available for stories


  Options:

    -d, --disabled        List custom fields including disabled
    -s, --search [query]  List custom fields with name containing query
    -h, --help            output usage information
```

```
  Usage: short custom-field <id> [options]

  view a custom field by id
```

Example:

```sh
npx short custom-fields --search priority
npx short custom-field 123e4567-e89b-12d3-a456-426614174000
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
    --objectives [id|name]    List epics linked to objective id/name, comma-separated
    -t, --title [query]       List epics with name/title containing query
    -s, --started             List epics that have been started
    -h, --help                output usage information
```

Example:

```sh
npx short epics --objectives "Our first Tactical Objective"
```

#### Epic Commands

```
  Usage: short epic [command] [options]

  create, view, or update epics


  Commands:

    create        create a new epic
    view <id>     view an epic by id
    update <id>   update an existing epic
    stories <id>  list stories in an epic
    comments <id> list comments on an epic
```

You can use `short epic` to create, view, or update a single epic.

View an epic:

```
  Usage: short epic view <id> [options]

  Options:

    -O, --open   Open epic in browser
    -h, --help   output usage information
```

Create an epic:

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
    -M, --milestone [id]       Set milestone of epic (deprecated, use objectives)
    --objectives [id|name]     Set objectives of epic, comma-separated
    -I, --idonly               Print only ID of epic result
    -O, --open                 Open epic in browser
    -h, --help                 output usage information
```

Update an epic:

```
  Usage: short epic update <id> [options]

  Options:

    -n, --name [text]          Set name of epic
    -d, --description [text]   Set description of epic
    -s, --state [name]         Set state of epic (to do, in progress, done)
    --deadline [date]          Set deadline for epic (YYYY-MM-DD)
    --planned-start [date]     Set planned start date (YYYY-MM-DD)
    -o, --owners [id|name]     Set owners of epic, comma-separated
    -T, --team [id|name]       Set team of epic
    -l, --label [id|name]      Set labels of epic, comma-separated
    -M, --milestone [id]       Set milestone of epic (deprecated, use objectives)
    --objectives [id|name]     Set objectives of epic, comma-separated
    -a, --archived             Archive epic
    -O, --open                 Open epic in browser
    -h, --help                 output usage information
```

List stories in an epic:

```
  Usage: short epic stories <id> [options]

  Options:

    -d, --detailed           Show more details for each story
    -f, --format [template]  Format each story output by template
    -h, --help               output usage information
```

Example:

```sh
npx short epic stories 36
```

List comments on an epic:

```
  Usage: short epic comments <id> [options]

  Options:

    -d, --detailed  Show nested replies for each comment
    -h, --help      output usage information
```

Example:

```sh
npx short epic comments 16
```

#### Epic Output Formatting

Templating variables:

```
%id      Print ID of epic
%t       Print title/name of epic
%m       Print milestone of epic
%obj     Print linked objectives of epic
%s       Print epic state
%dl      Print epic deadline
%d       Print epic description
%p       Print epic total points
%ps      Print epic total points started
%pd      Print epic total points done
%c       Print epic total completion percentage
%ar      Print archived status of epic
%st      Print started status of epic
%co      Print completed status of epic
```

### Objectives

```
  Usage: short objectives [options] [SEARCH OPERATORS]

  List and search Shortcut objectives. By default, lists all objectives.
  Passing search operators will use the Shortcut objective search API and
  page through all results.


  Options:

    -a, --archived          List only objectives including archived
    -c, --completed         List only objectives that have been completed
    -d, --detailed          List more details for each objective
    -f, --format [template] Format each objective output by template
    -s, --started           List objectives that have been started
    -S, --state [state]     Filter objectives by state
    -t, --title [query]     Filter objectives with name/title containing query
    -h, --help              output usage information
```

#### Objective Commands

```
  Usage: short objective [command] [options]

  view, create, or update objectives


  Commands:

    view <id>     view an objective by id
    create        create a new objective
    update <id>   update an existing objective
    epics <id>    list epics in an objective
```

You can use `short objective` to view, create, or update a single objective.

View an objective:

```
  Usage: short objective view <id> [options]

  Options:

    -O, --open   Open objective in browser
    -h, --help   output usage information
```

You can also view an objective directly by ID: `short objective <id>`

Create an objective:

```
  Usage: short objective create [options]

  Options:

    -n, --name [text]          Set name of objective, required
    -d, --description [text]   Set description of objective
    -s, --state [name]         Set state of objective (to do, in progress, done)
    --started-at [date]        Set started override (ISO date or YYYY-MM-DD)
    --completed-at [date]      Set completed override (ISO date or YYYY-MM-DD)
    -I, --idonly               Print only ID of objective result
    -O, --open                 Open objective in browser
    -h, --help                 output usage information
```

Update an objective:

```
  Usage: short objective update <id> [options]

  Options:

    -n, --name [text]          Set name of objective
    -d, --description [text]   Set description of objective
    -s, --state [name]         Set state of objective (to do, in progress, done)
    --started-at [date]        Set started override (ISO date or YYYY-MM-DD)
    --completed-at [date]      Set completed override (ISO date or YYYY-MM-DD)
    -a, --archived             Archive objective
    -O, --open                 Open objective in browser
    -h, --help                 output usage information
```

List epics in an objective:

```
  Usage: short objective epics <id>
```

### Iterations

```
  Usage: short iterations [options]

  Display iterations available for stories


  Options:

    -S, --status [status]     Filter by status (unstarted, started, done)
    -T, --team [id|name]      Filter by team/group id or name
    -C, --current             Show only current/active iterations
    -t, --title [query]       Filter iterations with name containing query
    -d, --detailed            Show more details for each iteration
    -f, --format [template]   Format each iteration output by template
    -h, --help                output usage information
```

#### Iteration View, Create, Update, Delete

```
  Usage: short iteration [command] [options]

  view, create, update, or delete iterations


  Commands:

    view <id>     view an iteration by id
    create        create a new iteration
    update <id>   update an existing iteration
    delete <id>   delete an iteration
    stories <id>  list stories in an iteration
```

View an iteration:

```
  Usage: short iteration view <id> [options]

  Options:

    -O, --open   Open iteration in browser
    -h, --help   output usage information
```

Create an iteration:

```
  Usage: short iteration create [options]

  Options:

    -n, --name [text]         Set name of iteration (required)
    -d, --description [text]  Set description of iteration
    --start-date [date]       Set start date (YYYY-MM-DD, required)
    --end-date [date]         Set end date (YYYY-MM-DD, required)
    -T, --team [id|name]      Set team/group of iteration
    -I, --idonly              Print only ID of iteration result
    -O, --open                Open iteration in browser
    -h, --help                output usage information
```

Update an iteration:

```
  Usage: short iteration update <id> [options]

  Options:

    -n, --name [text]         Set name of iteration
    -d, --description [text]  Set description of iteration
    --start-date [date]       Set start date (YYYY-MM-DD)
    --end-date [date]         Set end date (YYYY-MM-DD)
    -T, --team [id|name]      Set team/group of iteration
    -O, --open                Open iteration in browser
    -h, --help                output usage information
```

Delete an iteration:

```
  Usage: short iteration delete <id>
```

List stories in an iteration:

```
  Usage: short iteration stories <id> [options]

  Options:

    -f, --format [template]   Format each story output by template
    -h, --help                output usage information
```

#### Iteration Output Formatting

Templating variables:

```
%id          Print ID of iteration
%t           Print title/name of iteration
%s           Print iteration status
%start       Print iteration start date
%end         Print iteration end date
%teams       Print teams assigned to iteration
%stories     Print total number of stories
%done        Print number of completed stories
%points      Print total points
%pdone       Print completed points
%completion  Print completion percentage
%url         Print URL of iteration
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
pnpm run build:watch
```

You can run shortcut-cli with TypeScript map enabled:

```sh
pnpm start -- story 1234
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
