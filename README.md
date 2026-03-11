# JSON Visualizer for VS Code

Interactive graph view for JSON files inside VS Code. It turns nested payloads into a navigable node graph, lets you expand escaped JSON strings in place, and exports the result as PNG or YAML.

## Highlights

- Graph-based JSON preview directly from the editor title bar
- Right-click node actions: hide, unhide, collapse, expand
- Nested JSON string parsing with on-demand expansion
- Object, array, value, and parsed-node visual styling
- Fit view, zoom, PNG export, and YAML export controls
- Example fixtures under [`test/`](test) and rendered screenshots under [`images/`](images)

## Quick Start

1. Open this project in VS Code and run `npm install`.
2. Start the extension with `F5`.
3. In the Extension Development Host, open any `.json` file.
4. Click the editor title action `Preview JSON`.

You can also run `Preview JSON` from the Command Palette.

## What It Looks Like

Basic object layout:

![Basic object graph](images/basic-object.png)

Deep nested object layout:

![Deep tree graph](images/deep-tree.png)

Nested escaped JSON parsing:

![GraphQL request graph](images/graphql-request.png)

## Controls

- `Zoom In`, `Zoom Out`, `Fit View`
- `Download as PNG`
- `Download as YAML`
- Right click any node for visibility and collapse controls
- `Parse JSON value` on string fields that contain escaped JSON

## Development

Install dependencies:

```bash
npm install
```

Build once:

```bash
npm run compile
```

Watch mode:

```bash
npm run watch
```

Lint:

```bash
npm run lint
```

Extension test command:

```bash
npm test
```

## Sample Files

Use these fixtures while testing the preview:

- [`test/basic-object.json`](test/basic-object.json)
- [`test/deep-tree.json`](test/deep-tree.json)
- [`test/graphql-request.json`](test/graphql-request.json)
- [`test/mixed-arrays.json`](test/mixed-arrays.json)
- [`test/nested-encoded-json.json`](test/nested-encoded-json.json)
- [`test/wide-layout.json`](test/wide-layout.json)

## Privacy

The extension does not send JSON payloads anywhere. Preview rendering and exports stay local to the machine running VS Code.

## License

[MIT](LICENSE)
