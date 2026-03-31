# Development

## Local Setup

Install dependencies:

```bash
npm install
```

Build once:

```bash
npm run compile
```

Run webpack in watch mode:

```bash
npm run watch
```

Run lint:

```bash
npm run lint
```

Run extension tests:

```bash
npm test
```

## Running The Extension

1. Open the project in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. Open one of the sample JSON files.
4. Click `Preview JSON` in the editor title bar.

## Sample Files

Use these fixtures while working on layout, parsing, or export behavior:

- [`test/basic-object.json`](../test/basic-object.json)
- [`test/deep-tree.json`](../test/deep-tree.json)
- [`test/graphql-request.json`](../test/graphql-request.json)
- [`test/mixed-arrays.json`](../test/mixed-arrays.json)
- [`test/nested-encoded-json.json`](../test/nested-encoded-json.json)
- [`test/wide-layout.json`](../test/wide-layout.json)

## Notes

- The extension host entry point is `src/extension.ts`.
- The webview UI lives under `src/webview/`.
- The publish build runs through the `vscode:prepublish` script.
