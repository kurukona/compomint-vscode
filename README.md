# Compomint Template Support for VS Code

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=compomint.compomint-vscode)
[![Installs](https://img.shields.io/badge/installs-0-brightgreen.svg)](https://marketplace.visualstudio.com/items?itemName=compomint.compomint-vscode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Supercharge your Compomint development with comprehensive VS Code tooling for the Compomint template-based component engine. This extension makes it easy to write, preview and validate your Compomint templates with intelligent sample data detection and metadata support.

## About Compomint

[Compomint](https://compomint.dev/) is a lightweight JavaScript template-based component engine for web applications. With minimal footprint (~14KB gzipped), Compomint provides a simple yet powerful approach to building component-based user interfaces.

**Key Features:**
- 🚀 Lightweight and fast performance
- 📝 Template-based with simple string syntax
- 🎯 All-in-one templates (HTML, CSS, JavaScript in one file)
- ⚡ Reactive data binding and event handling
- 🧩 Component composition and state management
- 🌐 Built-in internationalization (i18n) support
- 🔄 Lazy loading and automatic template caching

**Learn More:**
- 📚 [Official Website](https://compomint.dev/)
- 🛠️ [GitHub Repository](https://github.com/kurukona/compomint)
- 📖 [Documentation & Examples](https://compomint.dev/)

*Extension overview screenshot coming soon*

## Key Features

### 🌈 Rich Syntax Highlighting

Compomint's special template syntax is beautifully highlighted in your HTML files, making it much easier to read and navigate complex components.

- Highlights all Compomint expressions (`##=`, `##-`, `##%`, etc.)
- Highlights Compomint special attributes (`data-co-event`, `data-co-named-element`, etc.)
- Works with standard HTML syntax highlighting

*Feature screenshots and demos coming soon*

### ✨ Intelligent Code Completion

Save time with intelligent suggestions as you type:

- Compomint expressions and attributes
- Component properties and methods
- Event handlers
- Attribute values

*Feature screenshots and demos coming soon*

### 📋 Productive Snippets

Accelerate your Compomint development with over 20 carefully crafted snippets:

| Prefix | Description |
|--------|-------------|
| `co-template` | Basic template structure |
| `co-button` | Button component template |
| `co-input` | Input component template |
| `co-modal` | Modal component template |
| `co-=` | Data interpolation |
| `co--` | HTML escape |
| `co-%` | Element insertion |
| And many more... | |

*Feature screenshots and demos coming soon*

### 👁️ Live Template Preview

Preview your Compomint templates in real-time without leaving VS Code:

- See immediate rendering of your templates
- Edit template data and see results instantly
- Test components with different data values
- Debug issues quickly

*Feature screenshots and demos coming soon*

### 🔬 Smart Sample Data Detection

Automatically detects and loads sample data from your templates:

- Supports HTML comments with "Sample" keyword: `<!--Sample tmpl.test.button({...})-->`
- Supports Compomint comments with "Sample" keyword: `##* Sample tmpl.test.button({...}) ##`
- Metadata support with @key: value syntax for organizing sample data
- Template ID normalization (supports both dot notation `test.button` and dash notation `test-button`)

Example sample data formats:
```html
<!-- Sample tmpl.plin.OrderSummary({
  orderId: "12345",
  total: 99.99,
  items: ["Item 1", "Item 2"]
}); 
@title: Order Summary Template
@category: E-commerce
@tags: order, summary, payment
-->

##* Sample tmpl.ui.Button({
  label: "Click Me!",
  type: "primary",
  disabled: false
});
@author: Development Team
@version: 1.0.0 ##
```

### ✅ Template Validation

Catch errors before they cause problems:

- Duplicate template IDs detection
- Style ID validation
- Unbalanced delimiters detection
- Automatic validation on save (configurable)

*Feature screenshots and demos coming soon*

### 🧩 Template Generator

Create new templates instantly:

- Multiple template types (basic, button, input, modal, etc.)
- Proper component structure with all required sections
- Best practices built-in
- Customizable template prefix

*Feature screenshots and demos coming soon*

## Installation

### Via VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Compomint Template Support"
4. Click Install

### Via VSIX File

1. Download the latest VSIX from the [releases page](https://github.com/kurukona/compomint-vscode/releases)
2. In VS Code, open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
3. Run "Extensions: Install from VSIX"
4. Select the downloaded VSIX file

## Usage

### Using Snippets

1. In an HTML file, type `co-` to see available snippets
2. Select the desired snippet and press Enter
3. Tab through the placeholder fields to fill in details

### Previewing Templates

1. Open an HTML file containing Compomint templates
2. Right-click in the editor and select "Compomint: Preview Template" from the context menu
   - Or open Command Palette (Ctrl+Shift+P / Cmd+Shift+P) and run "Compomint: Preview Template"
3. The preview panel appears showing all templates in the file
4. Edit template data in the JSON editor and click "Render Template" to update

### Creating New Templates

1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Run "Compomint: Create New Template"
3. Enter component name
4. Select template type
5. Template will be inserted at current cursor position or in a new file

## Extension Settings

This extension provides the following settings:

| Setting | Description | Default |
|---------|-------------|---------|
| `compomint.validateOnSave` | Validate Compomint templates on save | `true` |

## Commands

| Command | Description |
|---------|-------------|
| `Compomint: Preview Template` | Preview current template |
| `Compomint: Validate Template` | Validate templates in current document |
| `Compomint: Create New Template` | Create a new Compomint template |

## Requirements

- Visual Studio Code 1.60.0 or higher

## Compatibility

This extension supports:
- All HTML files
- Works with other HTML extensions (Emmet, etc.)
- Both ESM and UMD variants of Compomint

## Upcoming Features

We're working on these features for future releases:

- Language Server Protocol (LSP) implementation for more advanced code analysis
- Component dependency graph visualization
- Component documentation generation
- Performance optimization suggestions
- Test template generation

## License

This extension is licensed under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Clone the repository:
   ```
   git clone https://github.com/kurukona/compomint-vscode.git
   ```

2. Install dependencies:
   ```
   cd compomint-vscode
   npm install
   ```

3. Make your changes
4. Press F5 to start debugging with your changes
5. Submit a PR

## Issue Reporting

Please report issues or suggestions at [GitHub Issues](https://github.com/kurukona/compomint-vscode/issues).

## Release Notes

### 0.1.0

- Initial release
- Compomint template syntax highlighting
- Snippet support
- Template preview
- Template validation
- New template creation
- Smart sample data detection with metadata support
- Template ID normalization for better compatibility

---

**Enjoy building with Compomint!**
