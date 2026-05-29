# mK Coding Extension

A bundled VS Code coding experience with an mK theme, icon themes, and editor
quality-of-life features.

## Included

### Themes

- `mK Theme Dark`: a dark VS Code workbench and code theme based on ElegantTheme,
  with ElegantTheme used only as the code color source. The workbench UI is a
  custom mK base for neutral surfaces, menus, tabs, status and title bars,
  settings views, and configurable highlight accents.
- Code color variants: all other `mK Theme Dark ... Code` themes reuse the same
  mK workbench UI and only swap editor code colors. Variants are available for
  Balanced, Copilot, One Dark Pro, Atom One Dark, Dracula, VS Code 2026 Dark,
  Dark+, Dark Modern, Visual Studio Dark, and High Contrast.
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
- `mK Codex Commit Message`: optional Codex-powered Git commit message
  generation exposed as a separate SCM action and editor button.
- `mK Explorer Layout`: wider Explorer tree indentation and visible indent guides.
- Configurable mK highlight accent through `mkTheme.highlightPreset` and
  `mkTheme.highlightColor`.

## Usage

Open the command palette and select:

- `Preferences: Color Theme` -> `mK Theme Dark`
- `Preferences: Product Icon Theme` -> `mK Product Icons`
- `Preferences: File Icon Theme` -> `mK File Icons`

`mK Indent Rainbow` and the additional runtime features activate automatically
after startup. The Codex commit message action appears as a separate SCM button
when Codex generation is enabled.

For full title bar theming, set VS Code's `Window: Title Bar Style` to `custom`.
Native OS title bars cannot be fully colored by a theme extension.

## Settings

Settings are grouped by feature in VS Code's Settings UI.

### mK Theme

- `mkTheme.highlightPreset`: predefined highlight accent used by the mK
  workbench theme. Changing this setting updates supported workbench accents
  live.
- `mkTheme.highlightColor`: custom six-digit hex color used when
  `mkTheme.highlightPreset` is `custom`. VS Code shows this as a color setting in
  supported settings views.

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
  generation actions. Enabled by default because it is exposed as a separate
  action.
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

## Maintenance

Keep this README current whenever a theme, icon theme, runtime feature, setting,
or bundled third-party source changes. Feature-level implementation belongs under
`src/features`, shared TypeScript helpers under `src/shared`, bundled static
assets under `assets`, and maintenance scripts under `tools`. Keep
`upcomingChanges.md` current during normal feature work. Version bumps move those
notes into `CHANGELOG.md`, which stays in descending version order with the
newest release at the top.

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
