# Upcoming Changes

- Changed marketplace publishing so releases are published only by `v*.*.*` tag
  pushes with a matching `package.json` version.
- Reworked version bumping to create a release branch from `origin/main`, update
  release files, create a version commit, tag it, and push the branch and tag.
- Added automatic GitHub pull request creation for version update branches.
- Added `upcomingChanges.md` as the source for the next release notes; version
  bumps now move its contents into `CHANGELOG.md` and then clear it.
