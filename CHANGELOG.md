# Changelog

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
