# Upcoming Changes

- Split workspace and code colors so `mK Theme Dark`, `mK Theme Dimmed`, and
  `mK Theme Light` can share independently selectable code themes.
- Added `mK Theme: Select Code Theme` and `mkTheme.codeTheme` for live code color
  variant overrides.
- Removed theme generation from build and package scripts.
- Added a Marketplace/VSIX code theme importer for persistent user code theme
  variants.
- Added multi-select import and deletion for user code theme variants.
- Added `mK Theme Dimmed` and `mK Theme Light` workspace themes.
- Added Elegant code variants adapted for Dimmed and Light workspaces.
- Renamed Elegant-based code variants to `mK Code Dark`, `mK Code Dimmed`, and
  `mK Code Light`.
- Renamed built-in mK code variant files and default IDs away from `elegant`.
- Removed obsolete theme generator source files that are no longer used by the
  split workspace/code theme flow.
- Removed obsolete code theme `outputPath` metadata and the no-op mK Code Dark
  import script.
- Improved foreground contrast for the light workspace theme.
- Fixed Codex commit message generation for large diffs on Windows by sending
  the prompt through stdin instead of command-line arguments.
- Reworked the README around feature descriptions before technical details.
