/**
 * Related List Processor
 * Syncs relationships from frontmatter RELATED fields to Related section
 */

import type { CuratorProcessor } from '../models/curatorManager/types.js';
import { RunType } from '../models/curatorManager/types.js';
import { parseRelatedFrontmatter, generateRelatedSection } from '../models/contactNote/relationships.js';
import { findSectionByHeading, replaceSectionByHeading } from '../models/contactNote/markdown.js';

// Simple interface for contact data
interface ContactNote {
    path: string;
    frontmatter?: Record<string, any>;
    content: string;
}

export const relatedListProcessor: CuratorProcessor = {
    name: 'relatedListProcessor',
    description: 'Sync relationships from frontmatter to Related section',
    runType: RunType.UPCOMING,
    dependencies: [],
    
    async shouldRun(contact: ContactNote): Promise<boolean> {
        // Always run to keep Related section in sync with frontmatter
        return true;
    },
    
    async process(contact: ContactNote): Promise<void> {
        if (!contact.frontmatter) {
            return;
        }
        
        // Parse relationships from frontmatter
        const relationships = parseRelatedFrontmatter(contact.frontmatter);
        
        if (relationships.length === 0) {
            return;
        }
        
        // Generate Related section
        const relatedSection = generateRelatedSection(relationships);
        
        // Check if Related section exists
        const existingSection = findSectionByHeading(contact.content, 'Related');
        
        if (existingSection) {
            // Replace existing section
            contact.content = replaceSectionByHeading(contact.content, 'Related', relatedSection);
        } else {
            // Append new section
            contact.content = contact.content.trim() + '\n\n' + relatedSection;
        }
    }
};
