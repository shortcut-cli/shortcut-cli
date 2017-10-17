# clubhouse-cli

## Usage

~~~sh
  Usage: club [options] [command]

  A command line tool for searching and updating clubhouse.io stories


  Options:

    -V, --version  output the version number
    -h, --help     output usage information


  Commands:

    install         install and configure API access
    search [query]  search stories with optional query
    story           view or manipulate stories
    wf              list workflows and their states
    help [cmd]      display help for [cmd]
~~~

### Search

~~~sh
  Usage: club search [options]

  Search through clubouse stories


  Options:

    -a, --archived         Include archived Stories
    -I, --idonly           Print only ID of story results
    -l, --label [id|name]  Stories with label id/name
    -p, --project [id]     Stories in project
    -s, --state [id]       Stories in workflow state
    -t, --text [name]      Stories with text in name
    -y, --type [name]      Stories of type
    -h, --help             output usage information
~~~

### Stories

~~~sh
  Usage: club story [options] <id>

  Update and/or display story details


  Options:

    -I, --idonly             Print only ID of story results
    -s, --state [id]         Update workflow state of story
    -e, --estimate [number]  Update estimate of story
    -c, --comment [text]     Add comment to story
    -h, --help               output usage information
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
