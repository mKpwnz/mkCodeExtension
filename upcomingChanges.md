# Upcoming Changes

- Changed marketplace publishing so releases are published only after a release
  PR merge makes a matching `v*.*.*` tag reachable on `main`.
- Changed version bumping to return the local checkout to an updated `main`
  branch after creating the release pull request.
