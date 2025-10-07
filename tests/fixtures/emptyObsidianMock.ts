/**
 * Mock implementation of Obsidian API for testing
 * 
 * This provides minimal mocks for the Obsidian API classes and functions
 * that are used in the plugin code.
 */

export class App {
    vault: any;
    workspace: any;
    metadataCache: any;
}

export class Plugin {
    app: App;
    manifest: any;

    constructor(app: App, manifest: any) {
        this.app = app;
        this.manifest = manifest;
    }

    loadData(): Promise<any> {
        return Promise.resolve({});
    }

    saveData(data: any): Promise<void> {
        return Promise.resolve();
    }
}

export class TFolder {
    path: string = '';
    name: string = '';
    children: any[] = [];
    parent: TFolder | null = null;
    vault: any;

    isRoot(): boolean {
        return this.parent === null;
    }
}

export class TFile {
    path: string = '';
    name: string = '';
    extension: string = '';
    basename: string = '';
    parent: TFolder | null = null;
    vault: any;
}

export class TAbstractFile {
    path: string = '';
    name: string = '';
    parent: TFolder | null = null;
    vault: any;
}

export class Modal {
    app: App;
    containerEl: HTMLElement;
    contentEl: HTMLElement;
    modalEl: HTMLElement;
    titleEl: HTMLElement;
    scope: any;
    shouldRestoreSelection: boolean = false;

    constructor(app: App) {
        this.app = app;
        this.containerEl = document.createElement('div');
        this.contentEl = document.createElement('div');
        this.modalEl = document.createElement('div');
        this.titleEl = document.createElement('h1');
    }

    open(): void {}
    close(): void {}
    onOpen(): void {}
    onClose(): void {}
    setTitle(title: string): void {
        this.titleEl.textContent = title;
    }
    setContent(content: string): void {
        this.contentEl.innerHTML = content;
    }
}

export class Notice {
    constructor(message: string, duration?: number) {
        // Mock notice - does nothing
    }
}

export class AbstractInputSuggest<T> {
    protected app: App;
    protected inputEl: HTMLInputElement;

    constructor(app: App, inputEl: HTMLInputElement) {
        this.app = app;
        this.inputEl = inputEl;
    }

    protected getSuggestions(query: string): T[] | Promise<T[]> {
        return [];
    }

    renderSuggestion(value: T, el: HTMLElement): void {}

    selectSuggestion(value: T, evt?: MouseEvent | KeyboardEvent): void {}

    close(): void {}
}

export class Component {
    load(): void {}
    unload(): void {}
    onload(): void {}
    onunload(): void {}
    addChild(component: Component): Component {
        return component;
    }
    removeChild(component: Component): Component {
        return component;
    }
    register(cb: () => any): void {}
    registerEvent(eventRef: any): void {}
    registerDomEvent(el: HTMLElement, type: string, callback: any): void {}
    registerInterval(id: number): number {
        return id;
    }
}

export class PluginSettingTab {
    app: App;
    plugin: Plugin;
    containerEl: HTMLElement;

    constructor(app: App, plugin: Plugin) {
        this.app = app;
        this.plugin = plugin;
        this.containerEl = document.createElement('div');
    }

    display(): void {}
    hide(): void {}
}

export class Setting {
    settingEl: HTMLElement;

    constructor(containerEl: HTMLElement) {
        this.settingEl = document.createElement('div');
    }

    setName(name: string): this {
        return this;
    }

    setDesc(desc: string): this {
        return this;
    }

    addText(cb: (text: any) => any): this {
        const textComponent = {
            setPlaceholder: (placeholder: string) => textComponent,
            setValue: (value: string) => textComponent,
            onChange: (callback: (value: string) => any) => textComponent,
            inputEl: document.createElement('input')
        };
        cb(textComponent);
        return this;
    }

    addToggle(cb: (toggle: any) => any): this {
        const toggleComponent = {
            setValue: (value: boolean) => toggleComponent,
            onChange: (callback: (value: boolean) => any) => toggleComponent
        };
        cb(toggleComponent);
        return this;
    }

    addButton(cb: (button: any) => any): this {
        const buttonComponent = {
            setButtonText: (text: string) => buttonComponent,
            setCta: () => buttonComponent,
            onClick: (callback: () => any) => buttonComponent
        };
        cb(buttonComponent);
        return this;
    }
}

export const normalizePath = (path: string): string => {
    return path.replace(/\\/g, '/');
};

export const requestUrl = (request: any): Promise<any> => {
    return Promise.resolve({
        status: 200,
        headers: {},
        arrayBuffer: new ArrayBuffer(0),
        json: {},
        text: ''
    });
};
