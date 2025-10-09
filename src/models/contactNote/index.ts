/**
 * ContactNote module exports
 */

/**
 * ContactNote data structure used by curator processors
 * This is a simple data transfer object representing a contact note's essential data
 */
export interface ContactNote {
  /** File path in the vault */
  path: string;
  /** Frontmatter data */
  frontmatter?: Record<string, any>;
  /** Markdown content */
  content: string;
}

export type { Relationship, ContactSectionData, ContactField, Heading, ValidationResult } from './types';
export { 
  parseFrontmatter, 
  generateFrontmatter, 
  updateFrontmatter, 
  validateFrontmatter, 
  removeInvalidFields 
} from './frontmatter';
export {
  parseRelatedSection,
  generateRelatedSection,
  parseRelatedFrontmatter,
  generateRelatedFrontmatter,
  normalizeRelationshipType,
  getGenderedRelationshipType,
  inferGenderFromType,
  findRelatedHeading
} from './relationships';
export {
  parseContactSection,
  generateContactSection,
  extractHeadings,
  findSectionByHeading,
  replaceSectionByHeading,
  ensureSectionOrder
} from './markdown';
