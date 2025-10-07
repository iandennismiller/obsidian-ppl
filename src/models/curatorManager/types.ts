/**
 * Types for the curator pipeline system
 */

import type { ContactNote } from '../contactNote';

/**
 * When processors should run
 */
export enum RunType {
    /** Run as soon as data changes (high priority) */
    IMMEDIATELY = 'IMMEDIATELY',
    /** Run on schedule or when triggered (medium priority) */
    UPCOMING = 'UPCOMING',
    /** Run periodically for data quality (low priority) */
    IMPROVEMENT = 'IMPROVEMENT'
}

/**
 * Settings for a curator processor
 */
export interface CuratorSettingProperties {
    /** Setting key */
    key: string;
    /** Display name */
    name: string;
    /** Description */
    description: string;
    /** Default value */
    default: boolean;
}

/**
 * Curator processor interface
 */
export interface CuratorProcessor {
    /** Processor name (unique identifier) */
    name: string;
    /** Human-readable description */
    description: string;
    /** When this processor should run */
    runType: RunType;
    /** Names of processors this depends on */
    dependencies: string[];
    
    /**
     * Determine if processor should run for this contact
     */
    shouldRun(contact: ContactNote, settings: Record<string, any>): Promise<boolean>;
    
    /**
     * Process the contact
     */
    process(contact: ContactNote, settings: Record<string, any>): Promise<void>;
    
    /** Optional settings configuration */
    settingProperties?: CuratorSettingProperties;
}

/**
 * Queue item for curator processing
 */
export interface CuratorQueItem {
    /** Contact to process */
    contact: ContactNote;
    /** Processing priority */
    runType: RunType;
    /** When queued */
    timestamp: number;
}

/**
 * Queue status information
 */
export interface QueueStatus {
    /** Number of items in queue */
    queueLength: number;
    /** Is processor currently running */
    isProcessing: boolean;
    /** Active contact being processed */
    activeContact: string | null;
}
