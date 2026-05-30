# Changelog

## 0.1.14

- Added a React-based custom highlight color manager with system colors,
  user-defined colors, live preview, inline RGB/hex editing, and local user color
  storage.
- Added commands to manage custom highlight colors and delete saved user
  highlight colors.
- Improved highlight color selection by separating built-in extension colors
  from saved user highlight colors.
- Migrated extension webviews to a shared React/Tailwind bundle with reusable
  VS Code-styled components and a small webview messaging service.
- Migrated the commit message editor webview to the shared React webview
  runtime.

## 0.1.13

- Fixed Marketplace publishing so normal main merges no longer start the publish
  workflow approval unless `package.json` changes to a matching tagged version.
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

## 0.1.12

- Changed marketplace publishing so releases are published only after a release
  PR merge makes a matching `v*.*.*` tag reachable on `main`.
- Changed version bumping to return the local checkout to an updated `main`
  branch after creating the release pull request.

## 0.1.11

- Changed marketplace publishing so releases are published only by `v*.*.*` tag
  pushes with a matching `package.json` version.
- Reworked version bumping to create a release branch from `origin/main`, update
  release files, create a version commit, tag it, and push the branch and tag.
- Added automatic GitHub pull request creation for version update branches.
- Added `upcomingChanges.md` as the source for the next release notes; version
  bumps now move its contents into `CHANGELOG.md` and then clear it.

## 0.1.10

- Added Codex-powered commit message generation as a separate SCM/editor action.
- Enabled Codex commit message generation by default for fresh settings.
- Moved Codex commit message settings into the `mK Codex Commit Message`
  settings category while keeping existing setting keys compatible.
- Switched extension logging to VS Code's native log output channel style.
- Expanded the README with per-feature settings documentation, including live
  theme accent updates and Codex commit message configuration.

## 0.1.9

- TODO: Document release changes before publishing.

## 0.1.8

- Moved generated VSIX packages into the `build/` directory.
- Reorganized static extension assets under `assets/`, including file icons,
  product icons, generated themes, and theme source files.
- Moved maintenance scripts into `tools/` and kept shared tool helpers under
  `tools/lib`.
- Standardized source and tool file/folder naming to camelCase.
- Refactored internal source imports to use the `@/` alias where applicable.
- Added `mK Better Comments`, adapted as an mK-native comment tag highlighter.
- Added `mK Error Lens`, adapted for inline diagnostic messages and optional
  range highlighting.
- Added `mK Path Intellisense`, adapted as an mK path completion provider.
- Added `mK Commit Message Editor`, adapted as a compact Git SCM commit message
  editor.
- Added `mK Explorer Layout` settings for wider Explorer tree indentation and
  visible indent guides.
- Split the shared mK workbench UI base from code color variants so all themes
  inherit the same neutral mK workbench styling.
- Changed the ElegantTheme import so it only maintains the `mK Theme Dark` code
  color variant and no longer writes workbench/UI colors.
- Added `mK Theme Dark Balanced Code`.
- Added third-party code color variants for Copilot Theme, One Dark Pro, Atom One
  Dark, and Dracula.
- Added VS Code default dark code color variants for 2026 Dark, Dark+, Dark
  Modern, Visual Studio Dark, and High Contrast.
- Added theme generation from `assets/themeSources/baseWorkbenchColors.json` and
  `assets/themeSources/codeVariants`.
- Added upstream source tracking and third-party license/notice documentation for
  the newly bundled features and code theme sources.
- Extended extension validation to check generated theme/icon contribution paths,
  bundled notices, Biome indentation, and TypeScript path alias configuration.

## 0.1.7

- Corrected highlight preset naming: Lime is `#a1fb1a`, Green is `#17bf6b`.

## 0.1.6

- Replaced highlight presets with the requested color palette and kept Lime as the default.
- Restored cursor and active indent guide colors to neutral defaults.

## 0.1.5

- Split settings into mK Theme and mK Indent Rainbow categories.
- Improved highlight preset labels and custom color setting guidance.

## 0.1.4

- Added live-configurable theme highlight presets and custom highlight color.

## 0.1.3

- Softened focused settings rows with lower-contrast background and accent border.

## 0.1.2

- Unified UI highlight and focus accents around `#a1fb1a`.

## 0.1.1

- Removed invalid `window.titleBarStyle` configuration default.
- Refined workbench colors for title bar, status bar, menus, and terminal surfaces.

## 0.1.0

- Added Marketplace-ready extension scaffold.
- Added `mK Theme Dark`, adapted from ElegantTheme for JetBrains IDEs.
- Added `mK Product Icons`, adapted from Fluent Icons for VS Code.
- Added `mK File Icons`, adapted from Material Icon Theme for VS Code.
- Added `mK Indent Rainbow`, adapted from Indent Rainbow for VS Code.
- Neutralized workbench surfaces for a calmer dark gray UI.
