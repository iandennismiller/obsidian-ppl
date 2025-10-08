/**
 * Unit tests for ContactNote frontmatter operations
 */

import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter,
  generateFrontmatter,
  updateFrontmatter,
  validateFrontmatter,
  removeInvalidFields
} from '../../../../src/models/contactNote/frontmatter';

describe('Frontmatter Operations', () => {
  describe('parseFrontmatter', () => {
    it('should parse valid frontmatter', () => {
      const content = `---
UID: test-uid-123
FN: John Doe
EMAIL: john@example.com
---

# John Doe

Some content here.`;

      const { frontmatter, body } = parseFrontmatter(content);
      
      expect(frontmatter.UID).toBe('test-uid-123');
      expect(frontmatter.FN).toBe('John Doe');
      expect(frontmatter.EMAIL).toBe('john@example.com');
      expect(body).toContain('# John Doe');
    });

    it('should handle content without frontmatter', () => {
      const content = '# Just Content\n\nNo frontmatter here.';
      
      const { frontmatter, body } = parseFrontmatter(content);
      
      expect(frontmatter).toEqual({});
      expect(body).toBe(content);
    });

    it('should handle empty frontmatter', () => {
      const content = `---
---

Content`;

      const { frontmatter, body } = parseFrontmatter(content);
      
      expect(frontmatter).toEqual({});
      expect(body.trim()).toBe('Content');
    });
  });

  describe('generateFrontmatter', () => {
    it('should generate valid YAML frontmatter', () => {
      const data = {
        UID: 'test-uid',
        FN: 'John Doe',
        EMAIL: 'john@example.com'
      };
      
      const yaml = generateFrontmatter(data);
      
      expect(yaml).toContain('UID:');
      expect(yaml).toContain('FN:');
      expect(yaml).toContain('EMAIL:');
    });

    it('should return empty string for empty data', () => {
      const yaml = generateFrontmatter({});
      expect(yaml).toBe('');
    });
  });

  describe('updateFrontmatter', () => {
    it('should update existing frontmatter', () => {
      const content = `---
UID: test-uid
FN: John Doe
---

Content`;

      const updated = updateFrontmatter(content, {
        EMAIL: 'john@example.com'
      });
      
      expect(updated).toContain('UID:');
      expect(updated).toContain('test-uid');
      expect(updated).toContain('FN:');
      expect(updated).toContain('John Doe');
      expect(updated).toContain('EMAIL:');
      expect(updated).toContain('john@example.com');
      expect(updated).toContain('Content');
    });

    it('should create frontmatter if it doesnt exist', () => {
      const content = '# Content\n\nJust content.';
      
      const updated = updateFrontmatter(content, {
        UID: 'test-uid',
        FN: 'John Doe'
      });
      
      expect(updated).toContain('---');
      expect(updated).toContain('UID:');
      expect(updated).toContain('test-uid');
      expect(updated).toContain('FN:');
      expect(updated).toContain('John Doe');
    });
  });

  describe('validateFrontmatter', () => {
    it('should validate correct frontmatter', () => {
      const data = {
        UID: 'test-uid',
        FN: 'John Doe'
      };
      
      const result = validateFrontmatter(data);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing UID', () => {
      const data = {
        FN: 'John Doe'
      };
      
      const result = validateFrontmatter(data);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: UID');
    });

    it('should detect missing FN', () => {
      const data = {
        UID: 'test-uid'
      };
      
      const result = validateFrontmatter(data);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: FN (formatted name)');
    });
  });

  describe('removeInvalidFields', () => {
    it('should remove undefined fields', () => {
      const data = {
        UID: 'test-uid',
        FN: 'John Doe',
        EMAIL: undefined
      };
      
      const cleaned = removeInvalidFields(data);
      
      expect(cleaned.UID).toBe('test-uid');
      expect(cleaned.FN).toBe('John Doe');
      expect('EMAIL' in cleaned).toBe(false);
    });

    it('should keep valid fields', () => {
      const data = {
        UID: 'test-uid',
        FN: 'John Doe',
        EMAIL: 'john@example.com',
        AGE: 0
      };
      
      const cleaned = removeInvalidFields(data);
      
      expect(cleaned.UID).toBe('test-uid');
      expect(cleaned.FN).toBe('John Doe');
      expect(cleaned.EMAIL).toBe('john@example.com');
      expect(cleaned.AGE).toBe(0);
    });
  });
});
