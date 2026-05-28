# mK Coding Extension

A bundled VS Code coding experience with an mK color theme, product icons, and file icons.

## Included Themes

- `mK Theme Dark`
- `mK Product Icons`
- `mK File Icons`
- `mK Indent Rainbow`

## Usage

Open the command palette and select:

- `Preferences: Color Theme` -> `mK Theme Dark`
- `Preferences: Product Icon Theme` -> `mK Product Icons`
- `Preferences: File Icon Theme` -> `mK File Icons`

`mK Indent Rainbow` activates automatically after startup. Its settings use the
`mkIndentRainbow.*` namespace.

For full title bar theming, set VS Code's `Window: Title Bar Style` to `custom`.
Native OS title bars cannot be fully colored by a theme extension.

## Development

```powershell
bun install
bun run import:all
bun run check
bun run build
bun run package
```

## Third-Party Notices

This extension adapts and bundles third-party theme/icon assets. See
[`docs/THIRD_PARTY_NOTICES.md`](docs/THIRD_PARTY_NOTICES.md) and `NOTICE`.
