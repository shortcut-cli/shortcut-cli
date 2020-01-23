# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

---

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
