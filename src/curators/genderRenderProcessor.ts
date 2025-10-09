/**
 * Gender Render Processor
 * Renders relationships with gender-specific terms
 */

import type { CuratorProcessor } from '../models/curatorManager/types.js';
import { RunType } from '../models/curatorManager/types.js';
import { parseRelatedSection, getGenderedRelationshipType, generateRelatedSection } from '../models/contactNote/relationships.js';
import { replaceSectionByHeading } from '../models/contactNote/markdown.js';

// Simple interface for contact data
interface ContactNote {
    path: string;
    frontmatter?: Record<string, any>;
    content: string;
}

export const genderRenderProcessor: CuratorProcessor = {
    name: 'genderRenderProcessor',
    description: 'Render relationships with gender-specific terms',
    runType: RunType.UPCOMING,
    dependencies: ['genderInferenceProcessor'],
    
    async shouldRun(contact: ContactNote): Promise<boolean> {
        // Run if contact has gender and relationships
        const hasGender = !!contact.frontmatter?.GENDER;
        const relationships = parseRelatedSection(contact.content);
        return hasGender && relationships.length > 0;
    },
    
    async process(contact: ContactNote): Promise<void> {
        const gender = contact.frontmatter?.GENDER as 'M' | 'F' | 'O' | 'N' | 'U' | undefined;
        if (!gender) {
            return;
        }
        
        // Parse relationships
        const relationships = parseRelatedSection(contact.content);
        
        // Convert to gendered types
        const genderedRelationships = relationships.map(rel => ({
            ...rel,
            type: getGenderedRelationshipType(rel.type, gender)
        }));
        
        // Generate new Related section
        const relatedSection = generateRelatedSection(genderedRelationships);
        
        // Replace section
        contact.content = replaceSectionByHeading(contact.content, 'Related', relatedSection);
    }
};
