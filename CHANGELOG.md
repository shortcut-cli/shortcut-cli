# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Show team when showing stories.
### Changed
### Deprecated
### Removed
### Fixed
### Security

---

## 3.1.0

### Changed
- Updated typescript to 4.4.3
- Update shortcut client

## 3.0.0

TLDR: Renamed clubhouse-cli to shortcut-cli and `club` is now `short`.

### Added
- Branch base story inference: support for both `chNNNN` and `sc-NNNNN`.
- Add tests against Node 16 (soon to be LTS).
### Changed
- Renamed clubhouse-cli to shortcut-cli.
- `club` is now `short`.
- Switch branch format to `user/sc-NNNN/...` to fit Shortcut new prefix.
- Simplify the CircleCI configuration so it's easier to test against multiple versions with a matrix.
### Deprecated
### Removed
### Fixed
- Do not expect stories to have a project. Projects are now optional.

### Security
## [2.7.0] - 2020-08-17
### Added
- Add support for story search via estimate (thanks [@jbcrail](https://github.com/jbcrail)!).
- Add `prepublish` hook to ensure the project is built before it's being published.

## [2.6.3] - 2020-07-30
## [2.6.2] - 2020-07-30
## [2.6.1] - 2020-07-30
### Fixed
- Return clearer error message when trying to open the epic or iteration when the story is not assign to one or the other

## [2.6.0] - 2020-06-19
### Added
- Add support for `--git-branch-short` during story creation.

## [2.5.0] - 2020-06-18
### Added
- Add story formatting options for git branch and git branch short-name (thanks [@jshmfrankel](https://github.com/joshmfrankel)!)

## [2.4.0] - 2020-06-16
### Added
- Allow custom formatting of epics via `club epics --format` (thanks [@gowabash](https://github.com/gowabash)!)
### Security
- Upgrade dependencies.

## [2.3.1] - 2020-03-30
### Fixed
- Handle checking out to existing branches with `--git-branch`.
### Security
- Upgrade dependencies.

## [2.3.0] - 2020-02-24
### Added
- Allow filtering of epics by related milestone ID.
### Fixed
- Prevent accidental git branch story ID matches on usernames with numbers.
### Security
- Dependency updates.

## [2.2.4] - 2020-02-04
## [2.2.3] - 2020-02-03
### Fixed
- Fix bug in `clubhouse-lib` `/api/v3` which returns an invalid URL that could not be processed by the client.

## [2.2.2] - 2020-01-23
## [2.2.1] - 2020-01-23
### Fixed
- Allow story updated timestamp to be printed with custom formatter.

## [2.2.0] - 2020-01-22
### Added
- Respect `XDG_CONFIG_HOME` for the config location.
### Changed
- The `mentionName` and `urlSlug` (previously names `workspaceName`) configuration now get set automatically.
- The config is now only read once (unless noted otherwise).
### Security
- General dependency renovations.
### Upgrading
You will be prompted to run `club install --refresh` upon upgrading to this version, which will pull from the new current member API endpoint to load workspace information into the saved config.

## [2.1.0] - 2020-01-12
### Added
- In `club search`, replace `%self%` with the user's mention name.
- Accept options to open the story's epic, iteration and/or project.
- Use `xdg-open` on non-macOS platform.
- Add the `Config` interface and added `workspaceName` as a parameter.
### Security
- Several dependency upgrades via Renovatebot.

## [2.0.6] - 2019-11-06
### Changed
- Upgrade to latest `clubhouse-lib`.
### Fixed
- Fix completed status on story tasks.

## [2.0.5] - 2019-10-10
### Fixed
- Gracefully handle lack of git repository when searching for story ID.

## [2.0.4] - 2019-10-10
### Fixed
- Fix the import of prompt to conform to Typescript

## [2.0.3] - 2019-09-23
### Fixed
- Fix the entity returned by findProject by ID.

## [2.0.2] - 2019-08-15
### Fixed
- Remove source-map-support.

## [2.0.1] - 2019-08-15
### Fixed
- Remove development start script to prevent production override.

## [2.0.0] - 2019-08-15
### Added
- Support Iterations filtering/assignment on stories.

### Changed
- Convert to TypeScript.
- New formatting/argument syntax for Epic and story ID.
- Allow non-digit characters in story IDs.

## [1.17.0] - 2019-03-19
### Added
- Running tests on CircleCI.
- Allow for full JSON output in story format.

## [1.16.1] - 2019-03-13
### Fixed
- Fix the ability to open a story during creation.

## [1.16.0] - 2019-03-13
### Changed
- Remove bold styling on non-story-ID items in custom formatting.

## [1.15.1] - 2019-03-08
### Fixed
- Fix reference to non-imported function.

## [1.15.0] - 2019-03-06
### Added
- Added shorthand / aliases for commands see `club --help`.
- Added code formatting with prettier.

### Changed
- Renamed `club find` to `club search`.
- Extracted duplicated code to story lib.
- Cleaned up the initialization of commands.

### Deprecated
-  `club find` has been deprecated in favor of `club search`.

## [1.14.0] - 2019-02-28
### Added
- Support `story --git-branch-short` to create a branch without the story type.

## [1.13.0] - 2019-02-25
### Added
- Support searching via the clubhouse search API endpoint.

### Changed
- Upgrade `clubhouse-lib` to 0.5.0.
