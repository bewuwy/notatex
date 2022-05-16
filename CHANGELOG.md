# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added recently viewed note on home page (synced with the account)
- Added ability to close a popup by clicking outside it

### Changed

- Links in "Your Notes" use custom UID over the randomly-generated one
- Note view to use firebase database api instead of the custom web

### Deprecated

- *api/saveNote* and *api/deleteSavedNote* web api 

### Removed

### Fixed

### Security


## [0.2.1] - 2022-5-13

3rd release, yay!

### Added

- Added ability to remove custom UID
- Added labels to account settings

### Changed

- Moved your notes url setting to account settings block in account view

### Fixed

- Fixed your notes url loading wrongly into input
- Fixed popup sometimes showing behind some parts of the webpage
- Fixed word wrap in popup


## [0.2.0] - 2022-5-12

2nd release -> shorter links thanks to custom UIDs

### Added

- **Custom IDs!**
  - New setting on account page.
- On-site changelog popup
- Quote block

### Changed

- Theme settings icon in top bar.
- Some bad code to a little less bad one.


## [0.1.0] - 2022-5-5

**First release!**

### Added

- Firebase user accounts
- - User page with user's created notes list
- User "notes GitHub repository link" setting - ability to add own notes
- Themes support
- Saving (bookmarking) notes
- - Search bar in saved (and created) notes list
- Custom markdown rules
- - [Obsidian Callout](https://help.obsidian.md/How+to/Use+callouts)-like blocks
- Mathematical equations with LaTeX and MathJax
- Full mobile support
