import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, moment } from 'obsidian';
import { parseYaml, stringifyYaml } from 'obsidian';

interface LastUpdatedSettings {
	autoUpdateEnabled: boolean;
	fieldName: string;
	dateFormat: string;
	enabledByDefault: boolean;
}

const DEFAULT_SETTINGS: LastUpdatedSettings = {
	autoUpdateEnabled: true,
	fieldName: 'last-updated',
	dateFormat: 'YYYY-MM-DD HH:mm:ss',
	enabledByDefault: true
}

export default class LastUpdatedPlugin extends Plugin {
	settings: LastUpdatedSettings;

	async onload() {
		await this.loadSettings();

		// Add commands
		this.addCommand({
			id: 'update-last-modified',
			name: 'Update last-updated field',
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile && activeFile.extension === 'md') {
					this.updateLastModified(activeFile);
				} else {
					new Notice('No active markdown file');
				}
			}
		});

		this.addCommand({
			id: 'toggle-auto-update',
			name: 'Toggle auto-update for current file',
			callback: () => {
				this.toggleAutoUpdateForCurrentFile();
			}
		});

		this.addCommand({
			id: 'toggle-auto-update-globally',
			name: 'Toggle auto-update globally',
			callback: () => {
				this.toggleAutoUpdateGlobally();
			}
		});

		// Add settings tab
		this.addSettingTab(new LastUpdatedSettingTab(this.app, this));

		// Listen for file modifications
		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.handleFileModification(file);
				}
			})
		);
	}

	onunload() {
		// Plugin cleanup
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async handleFileModification(file: TFile) {
		// Only proceed if auto-update is globally enabled
		if (!this.settings.autoUpdateEnabled) {
			return;
		}

		try {
			const content = await this.app.vault.read(file);
			const { frontmatter, hasFrontmatter } = this.parseFrontmatter(content);

			// Check if this file should have auto-update
			const autoUpdateField = frontmatter['auto-update-last-modified'];
			const shouldUpdate = autoUpdateField !== undefined ? autoUpdateField : this.settings.enabledByDefault;

			if (hasFrontmatter && shouldUpdate) {
				// Small delay to avoid updating during the save operation itself
				setTimeout(() => {
					this.updateLastModified(file);
				}, 100);
			}
		} catch (error) {
			console.error('Error checking file for auto-update:', error);
		}
	}

	async updateLastModified(file: TFile) {
		try {
			const content = await this.app.vault.read(file);
			const { frontmatter, body, hasFrontmatter, originalFrontmatterText } = this.parseFrontmatter(content);

			// If no frontmatter exists, don't create it
			if (!hasFrontmatter) {
				return;
			}

			// Update the last-updated field while preserving order
			const currentTimestamp = this.formatDate();

			// Check if the field already exists and if the value is different
			if (frontmatter[this.settings.fieldName] === currentTimestamp) {
				return; // No need to update if it's the same
			}

			// Update the field value while preserving the order
			frontmatter[this.settings.fieldName] = currentTimestamp;

			// Reconstruct the file content
			const newContent = this.serializeFrontmatter(frontmatter, originalFrontmatterText) + '\n' + body;

			await this.app.vault.modify(file, newContent);
			new Notice(`Updated ${this.settings.fieldName} in ${file.name}`);
		} catch (error) {
			console.error('Error updating last modified:', error);
			new Notice('Error updating last modified field');
		}
	}

	private formatDate(): string {
		const now = moment();
		switch (this.settings.dateFormat) {
			case 'YYYY-MM-DD':
				return now.format('YYYY-MM-DD');
			case 'YYYY-MM-DD HH:mm':
				return now.format('YYYY-MM-DD HH:mm');
			case 'YYYY-MM-DD HH:mm:ss':
				return now.format('YYYY-MM-DD HH:mm:ss');
			case 'ISO':
				return now.toISOString();
			default:
				return now.format('YYYY-MM-DD HH:mm:ss');
		}
	}

	private parseFrontmatter(content: string): { frontmatter: any, body: string, hasFrontmatter: boolean, originalFrontmatterText?: string } {
		const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
		const match = content.match(frontmatterRegex);

		if (!match) {
			return {
				frontmatter: {},
				body: content,
				hasFrontmatter: false
			};
		}

		const frontmatterText = match[1];
		const body = match[2];

		try {
			const frontmatter = parseYaml(frontmatterText) || {};
			return {
				frontmatter,
				body,
				hasFrontmatter: true,
				originalFrontmatterText: frontmatterText
			};
		} catch (error) {
			console.error('Error parsing frontmatter:', error);
			return {
				frontmatter: {},
				body: content,
				hasFrontmatter: false
			};
		}
	}

	private serializeFrontmatter(frontmatter: any, originalText?: string): string {
		// If we have the original text, try to preserve the order by updating in place
		if (originalText && this.settings.fieldName in frontmatter) {
			const lines = originalText.split('\n');
			const fieldPattern = new RegExp(`^(${this.settings.fieldName}:\\s*)(.*)$`);

			for (let i = 0; i < lines.length; i++) {
				const match = lines[i].match(fieldPattern);
				if (match) {
					// Found the field, update its value
					const newValue = frontmatter[this.settings.fieldName];
					const quotedValue = typeof newValue === 'string' &&
						(newValue.includes(':') || newValue.includes('#') || newValue.includes('[') || newValue.includes('{'))
						? `"${newValue}"` : newValue;
					lines[i] = `${match[1]}${quotedValue}`;
					return `---\n${lines.join('\n')}\n---`;
				}
			}
		}

		// Fallback to standard YAML serialization
		try {
			const yamlText = stringifyYaml(frontmatter);
			return `---\n${yamlText}---`;
		} catch (error) {
			console.error('Error serializing frontmatter:', error);
			// Fallback manual serialization
			const lines = Object.entries(frontmatter).map(([key, value]) => {
				const quotedValue = typeof value === 'string' &&
					(value.includes(':') || value.includes('#') || value.includes('[') || value.includes('{'))
					? `"${value}"` : value;
				return `${key}: ${quotedValue}`;
			});
			return `---\n${lines.join('\n')}\n---`;
		}
	}

	async toggleAutoUpdateForCurrentFile() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.extension !== 'md') {
			new Notice('No active markdown file');
			return;
		}

		try {
			const content = await this.app.vault.read(activeFile);
			const { frontmatter, body, hasFrontmatter } = this.parseFrontmatter(content);

			// If file doesn't have frontmatter, inform user instead of creating it
			if (!hasFrontmatter) {
				new Notice('File has no frontmatter. Add frontmatter first to use auto-update control.');
				return;
			}

			// Toggle the auto-update field
			const currentValue = frontmatter['auto-update-last-modified'];
			const newValue = currentValue === undefined ? !this.settings.enabledByDefault : !currentValue;

			frontmatter['auto-update-last-modified'] = newValue;

			// Reconstruct the file content
			const newContent = this.serializeFrontmatter(frontmatter) + '\n' + body;

			await this.app.vault.modify(activeFile, newContent);
			new Notice(`Auto-update ${newValue ? 'enabled' : 'disabled'} for this file`);
		} catch (error) {
			console.error('Error toggling auto-update:', error);
			new Notice('Error toggling auto-update setting');
		}
	}

	async toggleAutoUpdateGlobally() {
		this.settings.autoUpdateEnabled = !this.settings.autoUpdateEnabled;
		await this.saveSettings();
		new Notice(`Auto-update globally ${this.settings.autoUpdateEnabled ? 'enabled' : 'disabled'}`);
	}
}

class LastUpdatedSettingTab extends PluginSettingTab {
	plugin: LastUpdatedPlugin;

	constructor(app: App, plugin: LastUpdatedPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Last Updated Plugin Settings' });

		new Setting(containerEl)
			.setName('Enable auto-update')
			.setDesc('Master switch to enable or disable automatic last-updated field updates across all files')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoUpdateEnabled)
				.onChange(async (value) => {
					this.plugin.settings.autoUpdateEnabled = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Field name')
			.setDesc('The YAML field name to update with the last modified time')
			.addText(text => text
				.setPlaceholder('last-updated')
				.setValue(this.plugin.settings.fieldName)
				.onChange(async (value) => {
					this.plugin.settings.fieldName = value || 'last-updated';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Date format')
			.setDesc('Format for the date timestamp')
			.addDropdown(dropdown => dropdown
				.addOption('YYYY-MM-DD', 'YYYY-MM-DD (2024-01-15)')
				.addOption('YYYY-MM-DD HH:mm', 'YYYY-MM-DD HH:mm (2024-01-15 14:30)')
				.addOption('YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm:ss (2024-01-15 14:30:25)')
				.addOption('ISO', 'ISO (2024-01-15T14:30:25.123Z)')
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					this.plugin.settings.dateFormat = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Enable by default')
			.setDesc('When the master switch is on, automatically update last-modified field for all files by default. Can be overridden per file with auto-update-last-modified frontmatter field.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enabledByDefault)
				.onChange(async (value) => {
					this.plugin.settings.enabledByDefault = value;
					await this.plugin.saveSettings();
				}));
	}
}
