/**
 * ContactNote module exports
 */

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
