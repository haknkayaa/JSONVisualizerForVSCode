# Change Log

All notable changes to the "JSON Visualizer" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-03-14

### Added
- Initial development release
- Interactive JSON visualization with React Flow
- Node-based diagram visualization
- Dark theme UI implementation
- Basic controls:
  - Zoom in/out
  - Fit view
  - Download as PNG
- Custom node styling with:
  - Hover effects
  - Smooth animations
  - Type-based coloring
- Edge features:
  - Animated connections
  - Smooth step paths
  - Label support
- Background grid pattern
- TypeScript implementation
- Webpack configuration
- Basic extension commands

### Known Issues
- Edge label positioning needs improvement
- Node spacing could be optimized
- Performance with large JSON files needs testing

## [Unreleased]

### Added
- Node context menu actions for hide, unhide, collapse, and expand flows
- Nested escaped JSON parsing from string values
- YAML export alongside PNG export
- Fixture JSON files under `test/` for layout and parsing checks
- Rendered example screenshots under `images/`

### Changed
- Editor title command shortened to `Preview JSON` and switched to a dedicated icon
- Array, object, value, and parsed nodes now use clearer visual treatment
- Container-only nodes now show path-based titles instead of appearing empty
- README refreshed with accurate usage instructions and sample images

### Fixed
- Node layout no longer stacks unrelated nodes onto the same coordinates
- Parsed JSON action now works reliably inside the React Flow webview
- Parsed subtree rendering for GraphQL-style request bodies is more consistent
- Webview mounting no longer calls `root.render()` on every VS Code update message
- Webview now waits for a `ready` handshake before the first JSON payload is pushed
- UI expand/hide/collapse state resets cleanly when the source JSON content changes

### Planned
- Search and filtering for large payloads
- Schema-aware views and validation hints
- Alternative layout strategies for very large graphs

[0.1.0]: https://github.com/haknkayaa/JSONVisualizerForVSCode/releases/tag/v0.1.0
