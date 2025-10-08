/**
 * Related FrontMatter Processor
 * Syncs relationships from Related section to frontmatter RELATED fields
 */

import type { CuratorProcessor } from '../models/curatorManager/types.js';
import { RunType } from '../models/curatorManager/types.js';
import { parseRelatedSection, generateRelatedFrontmatter } from '../models/contactNote/relationships.js';

// Simple interface for contact data
interface ContactNote {
    path: string;
    frontmatter?: Record<string, any>;
    content: string;
}

export const relatedFrontMatterProcessor: CuratorProcessor = {
    name: 'relatedFrontMatterProcessor',
    description: 'Sync relationships from Related section to frontmatter',
    runType: RunType.UPCOMING,
    dependencies: [],
    
    async shouldRun(contact: ContactNote): Promise<boolean> {
        // Always run to keep frontmatter in sync with Related section
        return true;
    },
    
    async process(contact: ContactNote): Promise<void> {
        if (!contact.frontmatter) {
            contact.frontmatter = {};
        }
        
        // Parse relationships from Related section
        const relationships = parseRelatedSection(contact.content);
        
        // Generate RELATED frontmatter fields
        const relatedFields = generateRelatedFrontmatter(relationships);
        
        // Update frontmatter with RELATED fields
        // First remove all existing RELATED fields
        for (const key in contact.frontmatter) {
            if (key.startsWith('RELATED.')) {
                delete contact.frontmatter[key];
            }
        }
        
        // Add new RELATED fields
        Object.assign(contact.frontmatter, relatedFields);
    }
};
