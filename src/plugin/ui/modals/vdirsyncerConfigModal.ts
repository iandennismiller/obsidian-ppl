import { App, Modal, Notice } from 'obsidian';
import { VdirsyncerService } from '../../services/vdirsyncerService';

/**
 * Settings interface for vdirsyncer configuration
 */
export interface VdirsyncerConfigSettings {
    vdirsyncerConfigPath: string;
}

/**
 * Modal for editing vdirsyncer configuration
 * 
 * Provides a text editor for the vdirsyncer config file
 * with validation and save functionality
 */
export class VdirsyncerConfigModal extends Modal {
    private configContent: string = '';
    private textareaEl: HTMLTextAreaElement | null = null;
    private vdirsyncerService: VdirsyncerService;

    constructor(
        app: App,
        private settings: VdirsyncerConfigSettings,
        private onSave?: () => void
    ) {
        super(app);
        this.vdirsyncerService = new VdirsyncerService();
    }

    /**
     * Called when modal opens
     * Loads config content and builds UI
     */
    async onOpen(): Promise<void> {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Edit vdirsyncer Configuration' });

        // Load config content
        try {
            this.configContent = await this.vdirsyncerService.readConfig(
                this.settings.vdirsyncerConfigPath
            );
        } catch (error) {
            this.configContent = '';
            new Notice('Config file not found. Creating new configuration.');
        }

        // Create textarea for editing
        this.textareaEl = contentEl.createEl('textarea', {
            cls: 'vdirsyncer-config-editor'
        });
        this.textareaEl.value = this.configContent;
        this.textareaEl.rows = 20;
        this.textareaEl.cols = 80;

        // Add some styling
        this.textareaEl.style.width = '100%';
        this.textareaEl.style.fontFamily = 'monospace';
        this.textareaEl.style.fontSize = '12px';

        // Button container
        const buttonContainer = contentEl.createEl('div', {
            cls: 'modal-button-container'
        });
        buttonContainer.style.marginTop = '1em';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '0.5em';

        // Validate button
        const validateButton = buttonContainer.createEl('button', {
            text: 'Validate'
        });
        validateButton.addEventListener('click', () => {
            this.validate();
        });

        // Save button
        const saveButton = buttonContainer.createEl('button', {
            text: 'Save',
            cls: 'mod-cta'
        });
        saveButton.addEventListener('click', async () => {
            await this.save();
        });

        // Cancel button
        const cancelButton = buttonContainer.createEl('button', {
            text: 'Cancel'
        });
        cancelButton.addEventListener('click', () => {
            this.close();
        });
    }

    /**
     * Validate the config content
     */
    private validate(): void {
        if (!this.textareaEl) return;

        const content = this.textareaEl.value;
        const result = this.vdirsyncerService.validateConfig(content);

        if (result.valid) {
            new Notice('✓ Configuration is valid');
        } else {
            const errors = result.errors?.join('\n') || 'Unknown error';
            new Notice(`✗ Configuration errors:\n${errors}`, 5000);
        }
    }

    /**
     * Save the config content
     */
    async save(): Promise<void> {
        if (!this.textareaEl) return;

        const content = this.textareaEl.value;

        // Validate before saving
        const result = this.vdirsyncerService.validateConfig(content);
        if (!result.valid) {
            const errors = result.errors?.join('\n') || 'Unknown error';
            new Notice(`Cannot save invalid configuration:\n${errors}`, 5000);
            return;
        }

        try {
            await this.vdirsyncerService.writeConfig(
                this.settings.vdirsyncerConfigPath,
                content
            );
            new Notice('Configuration saved successfully');
            
            // Call onSave callback if provided
            if (this.onSave) {
                this.onSave();
            }

            this.close();
        } catch (error) {
            new Notice(`Error saving configuration: ${error}`);
        }
    }

    /**
     * Called when modal closes
     */
    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
        this.textareaEl = null;
    }
}
