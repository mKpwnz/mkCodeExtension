# mK Coding Extension

A bundled VS Code coding experience with mK workspace themes, independent code
color themes, icon themes, and editor quality-of-life features.

## Features

### Workspace Themes and Code Themes

The extension separates the workbench from editor code colors.

Workspace themes control VS Code's UI: activity bar, side bar, tabs, panels,
menus, inputs, status bar, terminal surfaces, and accent highlights. Included
workspace themes are:

- `mK Theme Dark`: the default dark mK workspace theme.
- `mK Theme Dimmed`: the same mK theme language with a slightly brighter dark
  workspace.
- `mK Theme Light`: a light mK workspace theme with the same structure and accent
  behavior.

Code themes control editor token colors and can be changed independently from
the workspace theme. Use `mK Theme: Select Code Theme` to live-preview and select
code colors without switching the VS Code color theme itself.

Built-in code variants include `mK Code Dark`, `mK Code Dimmed`, `mK Code
Light`, Balanced, Copilot, One Dark Pro, Atom One Dark, Dracula, VS Code 2026
Dark, Dark+, Dark Modern, Visual Studio Dark, and High Contrast.

### Import Code Themes from Marketplace

`mK Theme: Import Code Theme from Marketplace` can import code colors from any VS
Code Marketplace theme extension. Paste a Marketplace URL, `publisher.extension`
id, or local `.vsix` path. If the extension contributes multiple themes, a
multi-select picker lets you choose one or more to import.

Imported code themes are stored in VS Code global extension storage, so they
survive extension updates. They appear in `mK Theme: Select Code Theme` under
`User Themes` and can be removed with `mK Theme: Delete User Code Themes`.

### Accent Color

`mkTheme.highlightPreset` and `mkTheme.highlightColor` update mK workspace
accents live. The accent is applied to all mK workspace themes.

Use `mK Theme: Select Highlight Color` to choose built-in extension highlight
colors or saved user highlight colors with live preview. Use `mK Theme: Manage
Custom Highlight Colors` to open the color manager, add or edit user highlight
colors with a hex/RGB color picker, apply system colors, rename saved colors, or
delete saved colors. User highlight colors are stored in VS Code global
extension storage and remain available after extension updates.

### Icons

- `mK Product Icons`: product icon theme derived from Fluent Icons.
- `mK File Icons`: file icon theme derived from Material Icon Theme.

### Editor Tools

- `mK Indent Rainbow`: runtime indentation highlighting adapted from Indent
  Rainbow.
- `mK Better Comments`: comment tag highlighting adapted from Better Comments.
- `mK Error Lens`: inline diagnostic highlighting adapted from Error Lens.
- `mK Path Intellisense`: path completion for imports and file references
  adapted from Path Intellisense.
- `mK Explorer Layout`: wider Explorer tree indentation and visible indent
  guides.

### Commit Message Tools

- `mK Commit Message Editor`: compact Git commit message editor inspired by
  Commit Message Editor.
- `mK Codex Commit Message`: optional Codex-powered Git commit message generation
  exposed as a separate SCM action and editor button.

## Usage

Open the command palette and use:

- `Preferences: Color Theme` -> `mK Theme Dark`, `mK Theme Dimmed`, or
  `mK Theme Light`
- `mK Theme: Select Code Theme`
- `mK Theme: Import Code Theme from Marketplace`
- `mK Theme: Delete User Code Themes`
- `mK Theme: Select Highlight Color`
- `mK Theme: Manage Custom Highlight Colors`
- `mK Theme: Delete User Highlight Colors`
- `Preferences: Product Icon Theme` -> `mK Product Icons`
- `Preferences: File Icon Theme` -> `mK File Icons`

For full title bar theming, set VS Code's `Window: Title Bar Style` to `custom`.
Native OS title bars cannot be fully colored by a theme extension.

## Settings

Settings are grouped by feature in VS Code's Settings UI.

### mK Theme

- `mkTheme.highlightPreset`: predefined highlight accent used by mK workspace
  themes.
- `mkTheme.highlightColor`: custom six-digit hex color used when
  `mkTheme.highlightPreset` is `custom`.
- `mkTheme.codeTheme`: code color variant applied live to all mK workspace themes
  through editor token customization overrides.

### mK Indent Rainbow

- `mkIndentRainbow.includedLanguages`: languages where indentation highlighting
  should be enabled. Empty means all languages except excluded languages.
- `mkIndentRainbow.excludedLanguages`: languages where indentation highlighting
  should be disabled.
- `mkIndentRainbow.ignoreErrorLanguages`: languages where indentation error
  detection is skipped. Use `*` to disable errors for all languages.
- `mkIndentRainbow.updateDelay`: delay in milliseconds before decorations update.
- `mkIndentRainbow.errorColor`: decoration color for indentation errors.
- `mkIndentRainbow.tabmixColor`: decoration color for mixed tabs and spaces.
- `mkIndentRainbow.ignoreLinePatterns`: regular expressions for lines that should
  skip indentation error highlighting.
- `mkIndentRainbow.colors`: indentation colors cycled by indent level.
- `mkIndentRainbow.colorOnWhiteSpaceOnly`: only color actual whitespace when an
  indent segment is incomplete.
- `mkIndentRainbow.indicatorStyle`: choose `classic` background blocks or `light`
  left-border indicators.
- `mkIndentRainbow.lightIndicatorStyleLineWidth`: line width used by the light
  indicator style.
- `mkIndentRainbow.maxLineCount`: maximum number of document lines decorated per
  update.

### mK Better Comments

- `mkBetterComments.enabled`: enable comment tag highlighting.
- `mkBetterComments.multilineComments`: highlight tags inside multiline comments.
- `mkBetterComments.highlightPlainText`: highlight tags in plain text files and
  non-comment text.
- `mkBetterComments.maxLineCount`: maximum number of document lines scanned for
  comment tags.
- `mkBetterComments.tags`: tag definitions and styles.

### mK Error Lens

- `mkErrorLens.enabled`: enable inline diagnostic highlighting.
- `mkErrorLens.enabledDiagnosticLevels`: diagnostic severities shown inline.
- `mkErrorLens.messageEnabled`: show diagnostic messages after the affected line.
- `mkErrorLens.problemRangeDecorationEnabled`: highlight the diagnostic range.
- `mkErrorLens.messageTemplate`: inline diagnostic template. Supports `$message`,
  `$source`, and `$code`.
- `mkErrorLens.messageMaxChars`: maximum number of characters per inline
  diagnostic message.
- `mkErrorLens.removeLinebreaks`: replace line breaks in diagnostic messages with
  spaces.

### mK Path Intellisense

- `mkPathIntellisense.extensionOnImport`: include file extensions in import
  completions.
- `mkPathIntellisense.mappings`: path aliases. Values can use
  `${workspaceFolder}`.
- `mkPathIntellisense.showHiddenFiles`: show hidden files in path completions.
- `mkPathIntellisense.autoSlashAfterDirectory`: insert a trailing slash after
  directory completions.

### mK Commit Message Editor

- `mkCommitMessageEditor.staticTemplate`: template inserted into the SCM input
  box.
- `mkCommitMessageEditor.reduceEmptyLines`: collapse more than two consecutive
  empty lines.
- `mkCommitMessageEditor.saveAndClose`: close the editor webview after saving to
  the SCM input box.

### mK Codex Commit Message

- `mkCommitMessageEditor.codexGenerationEnabled`: show Codex commit message
  generation actions.
- `mkCommitMessageEditor.codexModel`: model passed to the local Codex CLI.
- `mkCommitMessageEditor.codexReasoningEffort`: reasoning effort passed to the
  Codex CLI using `model_reasoning_effort`.
- `mkCommitMessageEditor.codexCommand`: command or full path used to run the
  local Codex CLI.
- `mkCommitMessageEditor.hideBuiltInGenerateButton`: disable Copilot for the SCM
  input language when Codex commit message generation is enabled.
- `mkCommitMessageEditor.codexTimeoutSeconds`: maximum time to wait for Codex
  commit message generation.
- `mkCommitMessageEditor.codexPrompt`: prompt template passed to the Codex CLI.
  Use `{diff}` as the staged or unstaged Git diff placeholder.

### mK Explorer

- `mkExplorer.indent`: Explorer tree indentation in pixels.
- `mkExplorer.renderIndentGuides`: Explorer tree indent guide visibility.

## Technical Details

Workspace themes are static VS Code color theme contributions under
`assets/themes`. Built-in code variants live under
`assets/themeSources/codeVariants` and are applied at runtime through:

- `editor.tokenColorCustomizations`
- `editor.semanticTokenColorCustomizations`

Imported user code themes are stored in this extension's VS Code global storage
directory under `codeThemes`. They are intentionally not stored in the extension
install directory, so extension updates do not remove them.

User highlight colors are stored in this extension's VS Code global storage
directory under `highlightColors`. Built-in system highlight colors are provided
by the extension, while user highlight colors are managed separately and shown as
a separate group in highlight color pickers.

Marketplace imports download or read a VSIX, parse JSON/JSONC theme files,
resolve theme `include` chains, and store only `tokenColors` and
`semanticTokenColors`. Workbench colors from imported themes are ignored so the
mK workspace theme stays consistent.

Webviews are built from `src/webviews` with React and Tailwind CSS into
`assets/webviews`. Route components receive their initial route state from the
shared webview app, while reusable components communicate with VS Code through a
small webview messaging service.

## Maintenance

Keep this README current whenever a theme, icon theme, runtime feature, setting,
or bundled third-party source changes. Feature-level implementation belongs under
`src/features`, shared TypeScript helpers under `src/shared`, bundled static
assets under `assets`, and maintenance scripts under `tools`.

Keep `upcomingChanges.md` current during normal feature work. Version bumps move
those notes into `CHANGELOG.md`, which stays in descending version order with the
newest release at the top.

## Development

```powershell
bun install
bun run import:all
bun run check
bun run build
bun run package
```

Packaged `.vsix` files are written to `build/`.

Version bumping requires the GitHub CLI (`gh`) to be installed and authenticated,
because the release script pushes the version branch and creates the release pull
request automatically.

## Third-Party Notices

This extension adapts and bundles third-party theme/icon assets and adapts
selected runtime behavior from third-party extensions. See
[`docs/THIRD_PARTY_NOTICES.md`](docs/THIRD_PARTY_NOTICES.md) and `NOTICE`.
