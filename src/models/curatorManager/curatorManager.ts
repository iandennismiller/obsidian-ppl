/**
 * CuratorManager - Coordinates processor execution and manages the curator pipeline
 */

import type { App, Plugin } from 'obsidian';
import type { ContactsPluginSettings } from '../../plugin/settings';
import type { ContactManager } from '../contactManager/contactManager';
import { ProcessorRegistry } from './processorRegistry';
import { CuratorQueue } from './queue';
import { RunType, CuratorSettingProperties } from './types';

// Import all standard curator processors
import { uidProcessor } from '../../curators/uidProcessor';
import { relatedFrontMatterProcessor } from '../../curators/relatedFrontMatterProcessor';
import { relatedListProcessor } from '../../curators/relatedListProcessor';
import { genderInferenceProcessor } from '../../curators/genderInferenceProcessor';
import { genderRenderProcessor } from '../../curators/genderRenderProcessor';

/**
 * CuratorManager class for coordinating curator processor execution
 */
export class CuratorManager {
    private app: App;
    private settings: ContactsPluginSettings;
    private contactManager: ContactManager;
    private registry: ProcessorRegistry;
    private queue: CuratorQueue;

    /**
     * Create a new CuratorManager instance
     */
    constructor(app: App, settings: ContactsPluginSettings, contactManager: ContactManager) {
        this.app = app;
        this.settings = settings;
        this.contactManager = contactManager;
        this.registry = new ProcessorRegistry();
        this.queue = new CuratorQueue();

        // Register all standard processors
        this.registerStandardProcessors();
    }

    /**
     * Register all standard curator processors
     */
    private registerStandardProcessors(): void {
        this.registry.register(uidProcessor);
        this.registry.register(relatedFrontMatterProcessor);
        this.registry.register(relatedListProcessor);
        this.registry.register(genderInferenceProcessor);
        this.registry.register(genderRenderProcessor);
    }

    /**
     * Register commands with the plugin
     */
    registerCommands(plugin: Plugin): void {
        // TODO: Implement command registration
        // For now, this is a no-op to satisfy the interface
        console.debug('[CuratorManager] Commands registration (stub)');
    }

    /**
     * Get the processor registry
     */
    getRegistry(): ProcessorRegistry {
        return this.registry;
    }

    /**
     * Get the curator queue
     */
    getQueue(): CuratorQueue {
        return this.queue;
    }
}

/**
 * Singleton curator service instance
 * This is for backwards compatibility with code that expects curatorService
 */
export const curatorService = {
    registry: new ProcessorRegistry(),
    queue: new CuratorQueue(),
    
    /**
     * Get processor settings
     * Returns empty array for now - processors will be registered at runtime
     */
    settings(): CuratorSettingProperties[] {
        return [];
    }
};
