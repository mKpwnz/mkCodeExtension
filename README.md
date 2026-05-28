# mK Coding Extension

A bundled VS Code coding experience with an mK theme, icon themes, and editor
quality-of-life features.

## Included

### Themes

- `mK Theme Dark`: a dark VS Code workbench and code theme based on ElegantTheme,
  with ElegantTheme used only as the code color source. The workbench UI is a
  custom mK base for neutral surfaces, menus, tabs, status and title bars,
  settings views, and configurable highlight accents.
- `mK Theme Dark Balanced Code`: the same mK workbench UI with an alternate,
  more balanced code color palette.
- `mK Theme Dark Copilot Code`: the same mK workbench UI with code colors
  adapted from Copilot Theme.
- `mK Theme Dark One Dark Pro Code`: the same mK workbench UI with code colors
  adapted from One Dark Pro.
- `mK Theme Dark Atom One Dark Code`: the same mK workbench UI with code colors
  adapted from Atom One Dark.
- `mK Theme Dark Dracula Code`: the same mK workbench UI with code colors
  adapted from Dracula.
- `mK Theme Dark VS Code 2026 Dark Code`: the same mK workbench UI with code
  colors adapted from VS Code's built-in 2026 Dark theme.
- `mK Theme Dark VS Code Dark+ Code`: the same mK workbench UI with code colors
  adapted from VS Code's built-in Dark+ theme.
- `mK Theme Dark VS Code Dark Modern Code`: the same mK workbench UI with code
  colors adapted from VS Code's built-in Dark Modern theme.
- `mK Theme Dark VS Code Visual Studio Dark Code`: the same mK workbench UI with
  code colors adapted from VS Code's built-in Visual Studio Dark theme.
- `mK Theme Dark VS Code High Contrast Code`: the same mK workbench UI with code
  colors adapted from VS Code's built-in High Contrast dark theme.
- `mK Product Icons`: product icon theme derived from Fluent Icons and bundled
  under the mK name.
- `mK File Icons`: file icon theme derived from Material Icon Theme and bundled
  under the mK name.

### Features

- `mK Indent Rainbow`: runtime indentation highlighting adapted from Indent
  Rainbow. This is an editor feature, not a VS Code theme contribution.
- `mK Better Comments`: comment tag highlighting adapted from Better Comments.
- `mK Error Lens`: inline diagnostic highlighting adapted from Error Lens.
- `mK Path Intellisense`: path completion for imports and file references adapted
  from Path Intellisense.
- `mK Commit Message Editor`: compact Git commit message editor inspired by
  Commit Message Editor.
- `mK Explorer Layout`: wider Explorer tree indentation and visible indent guides.
- Configurable mK highlight accent through `mkTheme.highlightPreset` and
  `mkTheme.highlightColor`.

## Usage

Open the command palette and select:

- `Preferences: Color Theme` -> `mK Theme Dark`
- `Preferences: Product Icon Theme` -> `mK Product Icons`
- `Preferences: File Icon Theme` -> `mK File Icons`

`mK Indent Rainbow` activates automatically after startup. Its settings use the
`mkIndentRainbow.*` namespace.

Additional runtime features activate automatically after startup. Their settings
use `mkBetterComments.*`, `mkErrorLens.*`, `mkPathIntellisense.*`, and
`mkCommitMessageEditor.*`. Explorer layout settings use `mkExplorer.*`.

For full title bar theming, set VS Code's `Window: Title Bar Style` to `custom`.
Native OS title bars cannot be fully colored by a theme extension.

## Maintenance

Keep this README current whenever a theme, icon theme, runtime feature, setting,
or bundled third-party source changes. Feature-level implementation belongs under
`src/features`, shared TypeScript helpers under `src/shared`, bundled static
assets under `assets`, and maintenance scripts under `tools`. Keep
`CHANGELOG.md` in descending version order, with the newest release at the top.

Theme workbench colors are maintained once in
`assets/themeSources/baseWorkbenchColors.json`. Code color variants live under
`assets/themeSources/codeVariants`. Run `bun run theme:generate` after changing
theme sources so every generated theme receives the shared UI base. Upstream code
theme imports must only write code variants and must not change
`baseWorkbenchColors.json`.

## Development

```powershell
bun install
bun run import:all
bun run check
bun run build
bun run package
```

Packaged `.vsix` files are written to `build/`.

## Third-Party Notices

This extension adapts and bundles third-party theme/icon assets and adapts
selected runtime behavior from third-party extensions. See
[`docs/THIRD_PARTY_NOTICES.md`](docs/THIRD_PARTY_NOTICES.md) and `NOTICE`.
