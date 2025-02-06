# JSON Visualizer for VS Code

A powerful Visual Studio Code extension that helps you visualize and navigate JSON files with ease.

## Features

- 🎨 **Interactive JSON Visualization**: Convert JSON data into an interactive tree view
- 🔍 **Search and Filter**: Quickly find specific values or keys in large JSON files
- 📊 **Collapsible Sections**: Expand/collapse nested objects and arrays
- 🎯 **Path Copy**: Copy the path to any JSON node with a single click
- 🌈 **Syntax Highlighting**: Custom theme for better JSON readability
- 🔄 **Auto-formatting**: Automatically format JSON files on save
- 📱 **Responsive Design**: Works well with different window sizes

![JSON Visualizer Demo](images/demo.gif)

## Installation

1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P`
3. Type `ext install jsonvisualizer`
4. Press Enter

## Usage

1. Open any JSON file in VS Code
2. Click the "Visualize JSON" button in the editor toolbar
3. Or use the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and search for "JSON Visualizer"

## Extension Settings

This extension contributes the following settings:

* `jsonVisualizer.autoVisualize`: Enable/disable automatic visualization when opening JSON files
* `jsonVisualizer.theme`: Choose between "light" and "dark" visualization themes
* `jsonVisualizer.maxDepth`: Set maximum depth for nested object expansion
* `jsonVisualizer.formatOnSave`: Enable/disable JSON formatting on save

## Keyboard Shortcuts

- `Alt+V`: Toggle JSON visualization
- `Alt+F`: Format JSON document
- `Alt+S`: Search in JSON
- `Alt+C`: Copy JSON path

## Known Issues

- Very large JSON files (>10MB) might cause performance issues
- Some special Unicode characters may not display correctly

## Release Notes

### 1.0.0
- Initial release
- Basic JSON visualization
- Search functionality
- Path copying

### 1.1.0
- Added dark theme support
- Improved performance for large files
- Added auto-formatting feature

### 1.2.0
- Added keyboard shortcuts
- Improved search functionality
- Bug fixes and performance improvements

## Contributing

Found a bug or have a feature request? Please open an issue on our [GitHub repository](https://github.com/yourusername/jsonvisualizer).

## License

This extension is licensed under the [MIT License](LICENSE.md).

## Support

Need help? Feel free to:
- Check our [documentation](https://github.com/yourusername/jsonvisualizer/wiki)
- Open an issue on [GitHub](https://github.com/yourusername/jsonvisualizer/issues)
- Send an email to support@jsonvisualizer.com

---

**Enjoy visualizing your JSON files!** 🎉
