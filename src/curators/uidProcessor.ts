/**
 * UID Processor - Ensures every contact has a UID
 */

import type { CuratorProcessor } from '../models/curatorManager/types.js';
import { RunType } from '../models/curatorManager/types.js';

// Simple interface for contact data
interface ContactNote {
    path: string;
    frontmatter?: Record<string, any>;
    content: string;
}

/**
 * Generate a simple UUID v4
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const uidProcessor: CuratorProcessor = {
    name: 'uidProcessor',
    description: 'Ensure every contact has a UID',
    runType: RunType.IMMEDIATELY,
    dependencies: [],
    
    async shouldRun(contact: ContactNote): Promise<boolean> {
        // Run if UID is missing
        return !contact.frontmatter?.UID;
    },
    
    async process(contact: ContactNote): Promise<void> {
        if (!contact.frontmatter) {
            contact.frontmatter = {};
        }
        
        // Generate new UUID
        contact.frontmatter.UID = `urn:uuid:${generateUUID()}`;
    }
};
