/**
 * Gender Inference Processor
 * Infers gender from relationship terms (mother → F, father → M)
 */

import type { CuratorProcessor } from '../models/curatorManager/types.js';
import { RunType } from '../models/curatorManager/types.js';
import { parseRelatedSection, inferGenderFromType } from '../models/contactNote/relationships.js';

// Simple interface for contact data
interface ContactNote {
    path: string;
    frontmatter?: Record<string, any>;
    content: string;
}

export const genderInferenceProcessor: CuratorProcessor = {
    name: 'genderInferenceProcessor',
    description: 'Infer gender from relationship terms',
    runType: RunType.UPCOMING,
    dependencies: ['relatedFrontMatterProcessor'],
    
    async shouldRun(contact: ContactNote): Promise<boolean> {
        // Run if contact has relationships but no gender set
        const relationships = parseRelatedSection(contact.content);
        return relationships.length > 0 && !contact.frontmatter?.GENDER;
    },
    
    async process(contact: ContactNote): Promise<void> {
        if (!contact.frontmatter) {
            contact.frontmatter = {};
        }
        
        // Parse relationships from Related section
        const relationships = parseRelatedSection(contact.content);
        
        // Try to infer gender from relationship types
        for (const rel of relationships) {
            const gender = inferGenderFromType(rel.type);
            if (gender) {
                contact.frontmatter.GENDER = gender;
                break;
            }
        }
    }
};
