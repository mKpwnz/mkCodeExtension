# Third-Party Notices

## ElegantTheme for JetBrains IDEs

- Source: https://github.com/leolin-idah/intellij-elegant-theme
- Imported ref: `af2c56a27047af98b9225e19485e4a01ae7fcf19`
- License: Apache-2.0
- Local license copy: `docs/licenses/elegant-theme-APACHE-2.0.txt`
- Usage: code color source for `mK Code Dark`, `mK Code Dimmed`, and
  `mK Code Light`.
- Modification notice: JetBrains editor scheme values were mapped to VS Code
  TextMate token colors and semantic token colors. `mK Code Dimmed` and
  `mK Code Light` adapt those mapped code colors for the matching mK workspace
  brightness. Workbench colors are no longer imported from ElegantTheme; all mK
  themes share the custom mK workbench base.

## Copilot Theme for Visual Studio Code

- Source: https://github.com/benjaminbenais/copilot-theme
- Imported ref: `2852220c241c9035a5e46988950bd40ab60ef447`
- License: MIT package declaration
- Local notice copy: `docs/licenses/copilot-theme-MIT-NOTICE.txt`
- Usage: code color source for `mK Theme Dark Copilot Code`.
- Modification notice: only TextMate token colors and semantic token colors are
  imported. VS Code workbench colors, fonts, icons, and other UI settings are not
  imported.

## One Dark Pro for Visual Studio Code

- Source: https://github.com/Binaryify/OneDark-Pro
- Imported ref: `6305452802975b158e34dfe634de02153bdcc34a`
- License: MIT
- Local license copy: `docs/licenses/one-dark-pro-MIT.txt`
- Usage: code color source for `mK Theme Dark One Dark Pro Code`.
- Modification notice: only TextMate token colors and semantic token colors are
  imported. VS Code workbench colors, fonts, icons, and other UI settings are not
  imported.

## Atom One Dark for Visual Studio Code

- Source: https://github.com/akamud/vscode-theme-onedark
- Imported ref: `a8be970644982221f9b61fb1c4b3da74b4beab79`
- License: MIT
- Local license copy: `docs/licenses/atom-one-dark-MIT.txt`
- Usage: code color source for `mK Theme Dark Atom One Dark Code`.
- Modification notice: only TextMate token colors and semantic token colors are
  imported. VS Code workbench colors, fonts, icons, and other UI settings are not
  imported.

## Dracula for Visual Studio Code

- Source: https://github.com/dracula/visual-studio-code
- Imported ref: `5512d0574f7db15f9c8989b0dd7292770b54906b`
- License: MIT
- Local license copy: `docs/licenses/dracula-vscode-MIT.txt`
- Usage: code color source for `mK Theme Dark Dracula Code`.
- Modification notice: only TextMate token colors and semantic token colors are
  imported from the generated upstream Dracula theme. VS Code workbench colors,
  fonts, icons, and other UI settings are not imported.

## Visual Studio Code Default Dark Themes

- Source: https://github.com/microsoft/vscode
- Imported ref: `1.121.0` / `f6cfa2ea2403534de03f069bdf160d06451ed282`
- License: MIT package declaration
- Local notice copy: `docs/licenses/vscode-default-themes-MIT-NOTICE.txt`
- Usage: code color source for the `mK Theme Dark VS Code ... Code` themes.
- Modification notice: only dark default TextMate token colors and semantic token
  colors are imported. VS Code workbench colors, light themes, fonts, icons, and
  other UI settings are not imported.

## Fluent Icons for Visual Studio Code

- Source: https://github.com/miguelsolorio/vscode-fluent-icons
- Imported ref: `0.0.19` / `f76a6bf031d280660514db8bc1cc1810fb530777`
- License: MIT
- Local license copy: `docs/licenses/vscode-fluent-icons-MIT.txt`
- Usage: bundled as `mK Product Icons`.
- Modification notice: theme id, font id, file names, and labels were renamed for this
  extension.

## Material Icon Theme for Visual Studio Code

- Source: https://github.com/material-extensions/vscode-material-icon-theme
- Imported ref: `v5.35.0` / `39b78e243a03328984ceeaf031843114f7181bbc`
- License: MIT
- Local license copy: `docs/licenses/vscode-material-icon-theme-MIT.txt`
- Usage: bundled as `mK File Icons`.
- Modification notice: generated static icon theme paths and labels were renamed for this
  extension. Runtime configuration commands from the upstream extension are not included.

## Indent Rainbow for Visual Studio Code

- Source: https://github.com/oderwat/vscode-indent-rainbow
- Imported ref: `4c78a0c3a9be6617c96891f7a40f2ad365c845ce`
- License: MIT
- Local license copy: `docs/licenses/vscode-indent-rainbow-MIT.txt`
- Usage: adapted as the `mK Indent Rainbow` runtime feature.
- Modification notice: settings were renamed from `indentRainbow.*` to `mkIndentRainbow.*`,
  and the runtime was refactored for this extension's TypeScript and quality rules.

## Better Comments for Visual Studio Code

- Source: https://github.com/aaron-bond/better-comments
- Imported ref: current cached upstream clone
- License: custom upstream license in `LICENSE.md`
- Local license copy: `docs/licenses/better-comments-LICENSE.md`
- Usage: adapted as the `mK Better Comments` runtime feature.
- Modification notice: settings were renamed to `mkBetterComments.*`, and the
  runtime was reimplemented as a compact mK-native comment tag highlighter.

## Error Lens for Visual Studio Code

- Source: https://github.com/usernamehw/vscode-error-lens
- Imported ref: current cached upstream clone
- License: MIT
- Local license copy: `docs/licenses/vscode-error-lens-MIT.txt`
- Usage: adapted as the `mK Error Lens` runtime feature.
- Modification notice: settings and commands were renamed to `mkErrorLens.*` and
  `mkErrorLens.*` command ids. The implementation focuses on inline diagnostic
  messages and range highlighting.

## Commit Message Editor for Visual Studio Code

- Source: https://github.com/bendera/vscode-commit-message-editor
- Imported ref: current cached upstream clone
- License: MIT
- Local license copy: `docs/licenses/vscode-commit-message-editor-MIT.txt`
- Usage: adapted as the `mK Commit Message Editor` runtime feature.
- Modification notice: command and setting ids were renamed to
  `mkCommitMessageEditor.*`. The bundled implementation is a compact mK-native
  Git SCM input editor rather than the full upstream frontend build.

## Path Intellisense for Visual Studio Code

- Source: https://github.com/ChristianKohler/PathIntellisense
- Imported ref: current cached upstream clone
- License: MIT
- Local license copy: `docs/licenses/path-intellisense-MIT.txt`
- Usage: adapted as the `mK Path Intellisense` runtime feature.
- Modification notice: settings were renamed to `mkPathIntellisense.*`, and the
  runtime was reimplemented as a compact path completion provider.
