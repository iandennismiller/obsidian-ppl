import { AbstractInputSuggest, App, TFolder } from 'obsidian';

/**
 * FolderSuggest provides folder path auto-completion in settings
 * 
 * Extends AbstractInputSuggest to show folder suggestions as user types
 */
export class FolderSuggest extends AbstractInputSuggest<TFolder> {
    constructor(
        app: App,
        private inputEl: HTMLInputElement
    ) {
        super(app, inputEl);
    }

    /**
     * Get folder suggestions based on input query
     * @param query - User input string
     * @returns Array of matching folders
     */
    protected getSuggestions(query: string): TFolder[] {
        const folders: TFolder[] = [];
        const lowerQuery = query.toLowerCase();

        // Get all folders from vault
        this.app.vault.getAllLoadedFiles().forEach(file => {
            if (file instanceof TFolder) {
                // Match folders that contain the query string
                if (file.path.toLowerCase().includes(lowerQuery)) {
                    folders.push(file);
                }
            }
        });

        // Sort folders by path length (shorter paths first)
        folders.sort((a, b) => a.path.length - b.path.length);

        return folders;
    }

    /**
     * Render a folder suggestion in the dropdown
     * @param folder - Folder to render
     * @param el - HTML element to render into
     */
    renderSuggestion(folder: TFolder, el: HTMLElement): void {
        el.createEl('div', { text: folder.path });
    }

    /**
     * Handle folder selection
     * @param folder - Selected folder
     */
    selectSuggestion(folder: TFolder): void {
        this.inputEl.value = folder.path;
        this.inputEl.trigger('input');
        this.close();
    }
}
