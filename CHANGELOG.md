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
