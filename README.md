# clubhouse-cli

## Usage

~~~sh
  Usage: club [options] [command]

  A command line tool for searching, viewing, and updating clubhouse.io stories


  Options:

    -V, --version  output the version number
    -h, --help     output usage information


  Commands:

    install         install and configure API access
    find [query]    find stories with optional query
    story           view or manipulate stories
    wf              list workflows and their states
    help [cmd]      display help for [cmd]
~~~

### Search

~~~sh
  Usage: club-find [options]

  Search through clubouse stories


  Options:

    -a, --archived         Include archived Stories
    -I, --idonly           Print only ID of story results
    -l, --label [id|name]  Stories with label id/name, by regex
    -o, --owner [name]     Stories with owner, by regex
    -p, --project [id]     Stories in project
    -s, --state [id|name]  Stories in workflow state id/name, by regex
    -t, --text [name]      Stories with text in name, by regex
    -y, --type [name]      Stories of type, by regex
    -h, --help             output usage information
~~~

Example output

~~~sh
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

~~~sh
  Usage: club-story [options] <id>

  Update and/or display story details


  Options:

    -I, --idonly             Print only ID of story results
    -s, --state [id|name]    Update workflow state of story
    -e, --estimate [number]  Update estimate of story
    -c, --comment [text]     Add comment to story
    -o, --open               Open story in browser
    -h, --help               output usage information
~~~

Example output:

~~~sh
$ club story 1480 -c 'This is a commend'
#1480 Create Thinga-ma-bob
Desc:    Create a thing to display:
Owners:  Josh (josh)
Type:    feature/3
Label:   #512 client_web
Project: #14
State:   #500000020 Code Review
URL:     https://app.clubhouse.io/story/1480
Comment: This is a commend
  at: 2017-10-25T16:17:04Z
~~~

### Workflows

~~~sh
  Usage: club wf [options]

  Display workflows/states available for stories


  Options:

    -s, --search [query]  List states containing query
    -h, --help            output usage information
~~~

### Install

Install via npm:

~~~sh
$ npm install clubhouse-cli -g
~~~

~~~sh
  Usage: club install [options]

  Install access token for clubhouse API


  Options:

    -V, --version  output the version number
    -f, --force    Force install/reinstall
    -h, --help     output usage information
~~~
