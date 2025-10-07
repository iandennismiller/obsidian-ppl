/**
 * Unit tests for ContactNote relationship operations
 */

import { describe, it, expect } from 'vitest';
import {
  parseRelatedSection,
  generateRelatedSection,
  parseRelatedFrontmatter,
  generateRelatedFrontmatter,
  normalizeRelationshipType,
  getGenderedRelationshipType,
  inferGenderFromType,
  findRelatedHeading
} from '../../../../src/models/contactNote/relationships';

describe('Relationship Operations', () => {
  describe('parseRelatedSection', () => {
    it('should parse relationships from Related section', () => {
      const content = `# Contact Note

## Related

- friend [[Alice]]
- colleague [[Bob Smith]]
- parent [[Charles]]

## Notes

Some notes.`;

      const relationships = parseRelatedSection(content);
      
      expect(relationships).toHaveLength(3);
      expect(relationships[0].type).toBe('friend');
      expect(relationships[0].targetName).toBe('Alice');
      expect(relationships[1].type).toBe('colleague');
      expect(relationships[1].targetName).toBe('Bob Smith');
    });

    it('should return empty array if no Related section', () => {
      const content = '# Just Content\n\nNo related section.';
      
      const relationships = parseRelatedSection(content);
      
      expect(relationships).toEqual([]);
    });
  });

  describe('generateRelatedSection', () => {
    it('should generate Related section markdown', () => {
      const relationships = [
        { type: 'friend', targetUID: 'uid1', targetName: 'Alice', namespace: 'uid' as const },
        { type: 'colleague', targetUID: 'uid2', targetName: 'Bob', namespace: 'uid' as const }
      ];
      
      const markdown = generateRelatedSection(relationships);
      
      expect(markdown).toContain('## Related');
      expect(markdown).toContain('- friend [[Alice]]');
      expect(markdown).toContain('- colleague [[Bob]]');
    });

    it('should return empty string for empty relationships', () => {
      const markdown = generateRelatedSection([]);
      expect(markdown).toBe('');
    });
  });

  describe('parseRelatedFrontmatter', () => {
    it('should parse RELATED fields from frontmatter', () => {
      const frontmatter = {
        'RELATED.friend': 'uid:alice-123',
        'RELATED.colleague.0': 'uid:bob-456',
        'RELATED.colleague.1': 'uid:charlie-789'
      };
      
      const relationships = parseRelatedFrontmatter(frontmatter);
      
      expect(relationships).toHaveLength(3);
      expect(relationships[0].type).toBe('friend');
      expect(relationships[0].targetUID).toBe('alice-123');
      expect(relationships[1].type).toBe('colleague');
      expect(relationships[1].targetUID).toBe('bob-456');
    });

    it('should handle urn:uuid namespace', () => {
      const frontmatter = {
        'RELATED.friend': 'urn:uuid:12345678-1234-5678-1234-567812345678'
      };
      
      const relationships = parseRelatedFrontmatter(frontmatter);
      
      expect(relationships[0].namespace).toBe('urn:uuid');
      expect(relationships[0].targetUID).toBe('12345678-1234-5678-1234-567812345678');
    });
  });

  describe('generateRelatedFrontmatter', () => {
    it('should generate RELATED frontmatter fields', () => {
      const relationships = [
        { type: 'friend', targetUID: 'alice-123', namespace: 'uid' as const },
        { type: 'colleague', targetUID: 'bob-456', namespace: 'uid' as const },
        { type: 'colleague', targetUID: 'charlie-789', namespace: 'uid' as const }
      ];
      
      const frontmatter = generateRelatedFrontmatter(relationships);
      
      expect(frontmatter['RELATED.FRIEND']).toBe('uid:alice-123');
      expect(frontmatter['RELATED.COLLEAGUE.0']).toBe('uid:bob-456');
      expect(frontmatter['RELATED.COLLEAGUE.1']).toBe('uid:charlie-789');
    });
  });

  describe('normalizeRelationshipType', () => {
    it('should normalize gendered types to genderless', () => {
      expect(normalizeRelationshipType('mother')).toBe('parent');
      expect(normalizeRelationshipType('father')).toBe('parent');
      expect(normalizeRelationshipType('sister')).toBe('sibling');
      expect(normalizeRelationshipType('brother')).toBe('sibling');
      expect(normalizeRelationshipType('son')).toBe('child');
      expect(normalizeRelationshipType('daughter')).toBe('child');
    });

    it('should leave genderless types unchanged', () => {
      expect(normalizeRelationshipType('friend')).toBe('friend');
      expect(normalizeRelationshipType('colleague')).toBe('colleague');
    });
  });

  describe('getGenderedRelationshipType', () => {
    it('should return gendered type for male gender', () => {
      expect(getGenderedRelationshipType('parent', 'M')).toBe('father');
      expect(getGenderedRelationshipType('sibling', 'M')).toBe('brother');
      expect(getGenderedRelationshipType('child', 'M')).toBe('son');
    });

    it('should return gendered type for female gender', () => {
      expect(getGenderedRelationshipType('parent', 'F')).toBe('mother');
      expect(getGenderedRelationshipType('sibling', 'F')).toBe('sister');
      expect(getGenderedRelationshipType('child', 'F')).toBe('daughter');
    });

    it('should return original type if no gender mapping', () => {
      expect(getGenderedRelationshipType('friend', 'M')).toBe('friend');
      expect(getGenderedRelationshipType('colleague', 'F')).toBe('colleague');
    });
  });

  describe('inferGenderFromType', () => {
    it('should infer male gender from type', () => {
      expect(inferGenderFromType('father')).toBe('M');
      expect(inferGenderFromType('brother')).toBe('M');
      expect(inferGenderFromType('son')).toBe('M');
      expect(inferGenderFromType('husband')).toBe('M');
    });

    it('should infer female gender from type', () => {
      expect(inferGenderFromType('mother')).toBe('F');
      expect(inferGenderFromType('sister')).toBe('F');
      expect(inferGenderFromType('daughter')).toBe('F');
      expect(inferGenderFromType('wife')).toBe('F');
    });

    it('should return undefined for genderless types', () => {
      expect(inferGenderFromType('friend')).toBeUndefined();
      expect(inferGenderFromType('colleague')).toBeUndefined();
    });
  });

  describe('findRelatedHeading', () => {
    it('should find Related heading', () => {
      const content = `# Title

## Related

Content`;

      const result = findRelatedHeading(content);
      
      expect(result).not.toBeNull();
      expect(result!.heading).toContain('Related');
    });

    it('should return null if no Related heading', () => {
      const content = '# Title\n\nNo related section.';
      
      const result = findRelatedHeading(content);
      
      expect(result).toBeNull();
    });

    it('should be case-insensitive', () => {
      const content = '## RELATED\n\nContent';
      
      const result = findRelatedHeading(content);
      
      expect(result).not.toBeNull();
    });
  });
});
