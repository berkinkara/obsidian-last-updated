import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

interface LastUpdatedSettings {
	autoUpdateEnabled: boolean;
	fieldName: string;
	dateFormat: string;
	enabledByDefault: boolean;
}

const DEFAULT_SETTINGS: LastUpdatedSettings = {
	autoUpdateEnabled: false,
	fieldName: 'last-updated',
	dateFormat: 'YYYY-MM-DD HH:mm:ss',
	enabledByDefault: true
}

export default class LastUpdatedPlugin extends Plugin {
	settings: LastUpdatedSettings;

	async onload() {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new LastUpdatedSettingTab(this.app, this));
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
			.setDesc('Automatically update last-modified field for all files. Can be overridden per file with auto-update-last-modified frontmatter field.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enabledByDefault)
				.onChange(async (value) => {
					this.plugin.settings.enabledByDefault = value;
					await this.plugin.saveSettings();
				}));
	}
}
