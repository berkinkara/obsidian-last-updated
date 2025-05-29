# Obsidian Last Updated Plugin

Automatically updates a YAML field (e.g., `last-updated`) with the file's last modified time every time a markdown file is saved in Obsidian.

## Features

- **Automatic Updates**: Automatically updates the specified YAML field when you save a markdown file
- **Master Switch**: Global enable/disable toggle for all automatic updates
- **Per-File Control**: Enable or disable auto-updates for individual files using frontmatter
- **Manual Updates**: Use commands to manually update the last-modified field
- **Configurable Field Name**: Customize the YAML field name (default: `last-updated`)
- **Multiple Date Formats**: Choose from different date formats (YYYY-MM-DD, YYYY-MM-DD HH:mm, YYYY-MM-DD HH:mm:ss, ISO)

## Installation

### Manual Installation

1. Download the latest release files (`main.js`, `manifest.json`, `styles.css`)
2. Create a folder named `obsidian-last-updated` in your vault's `.obsidian/plugins/` directory
3. Place the downloaded files in this folder
4. Restart Obsidian
5. Go to Settings → Community Plugins and enable "Last Updated"

### Development Installation

1. Clone this repository into your vault's `.obsidian/plugins/` directory
2. Run `npm install` to install dependencies
3. Run `npm run build` to compile the plugin
4. Restart Obsidian and enable the plugin

## Usage

### Basic Usage

Once enabled, the plugin will automatically add or update a `last-updated` field in your markdown files' frontmatter whenever you save the file:

```yaml
---
title: My Note
last-updated: 2024-01-15 14:30:25
---

Your note content here...
```

### Configuration

Access the plugin settings through Settings → Community Plugins → Last Updated → Options:

- **Enable auto-update**: Master switch to enable or disable automatic last-updated field updates across all files
- **Field name**: Customize the YAML field name (default: `last-updated`)
- **Date format**: Choose your preferred date format:
  - `YYYY-MM-DD` (e.g., 2024-01-15)
  - `YYYY-MM-DD HH:mm` (e.g., 2024-01-15 14:30)
  - `YYYY-MM-DD HH:mm:ss` (e.g., 2024-01-15 14:30:25)
  - `ISO` (e.g., 2024-01-15T14:30:25.123Z)
- **Enable by default**: When the master switch is on, whether to automatically update all files by default. Can be overridden per file with the `auto-update-last-modified` frontmatter field.

### Per-File Control

The plugin provides flexible control over auto-updates through a combination of global settings and per-file frontmatter:

1. **Master Switch**: Must be enabled for any automatic updates to occur
2. **Enable by default**: When the master switch is on, determines the default behavior for all files
3. **Per-file override**: Use the `auto-update-last-modified` frontmatter field to override the default behavior

You can control auto-updates on a per-file basis using the `auto-update-last-modified` frontmatter field:

**When "Enable by default" is ON (default):**
```yaml
---
title: My Note
auto-update-last-modified: false  # Disable auto-updates for this file only
last-updated: 2024-01-15 14:30:25
---
```

**When "Enable by default" is OFF:**
```yaml
---
title: My Important Note
auto-update-last-modified: true   # Enable auto-updates for this file only
last-updated: 2024-01-15 14:30:25
---
```

### Commands

The plugin provides two commands accessible via the Command Palette (Ctrl/Cmd + P):

1. **Update last-updated field**: Manually update the last-modified field for the current file
2. **Toggle auto-update for current file**: Toggle auto-update on/off for the current file

## Examples

### Example 1: Basic Note
```yaml
---
title: Meeting Notes
tags: [meeting, work]
last-updated: 2024-01-15 14:30:25
---

# Meeting Notes

Content of your meeting notes...
```

### Example 2: Disabled Auto-Update
```yaml
---
title: Template Note
template: true
auto-update-last-modified: false
last-updated: 2024-01-01 12:00:00
---

This is a template that shouldn't be auto-updated.
```

### Example 3: Different Date Format (ISO)
```yaml
---
title: Technical Document
last-updated: 2024-01-15T14:30:25.123Z
---

Technical content here...
```

### Example 4: Different Date Format (YYYY-MM-DD HH:mm)
```yaml
---
title: Meeting Notes
last-updated: 2024-01-15 14:30
---

Shorter timestamp format without seconds...
```

## Development

### Building the Plugin

```bash
npm install
npm run build
```

### Development Mode

```bash
npm run dev
```

This will watch for changes and automatically rebuild the plugin.

### Project Structure

- `main.ts` - Main plugin code
- `manifest.json` - Plugin manifest
- `styles.css` - Plugin styles
- `package.json` - Node.js dependencies and scripts


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have feature requests, please [create an issue](https://github.com/your-username/obsidian-last-updated/issues) on GitHub.

## Changelog

### 0.1.0
- Initial release
- Automatic last-updated field updates on file save
- Configurable field name and date formats
- Per-file enable/disable control
- Manual update commands
