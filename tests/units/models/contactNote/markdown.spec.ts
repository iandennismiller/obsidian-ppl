/**
 * Unit tests for ContactNote markdown operations
 */

import { describe, it, expect } from 'vitest';
import {
  parseContactSection,
  generateContactSection,
  extractHeadings,
  findSectionByHeading,
  replaceSectionByHeading
} from '../../../../src/models/contactNote/markdown';

describe('Markdown Operations', () => {
  describe('parseContactSection', () => {
    it('should parse Contact section with emails and phones', () => {
      const content = `# Contact Note

## Contact

- work john@work.com
- home 555-1234
- cell 555-5678

## Notes`;

      const data = parseContactSection(content);
      
      expect(data.emails).toHaveLength(1);
      expect(data.emails[0].value).toBe('john@work.com');
      expect(data.emails[0].type).toBe('work');
      
      expect(data.phones).toHaveLength(2);
    });

    it('should return empty data if no Contact section', () => {
      const content = '# Just Content';
      
      const data = parseContactSection(content);
      
      expect(data.emails).toEqual([]);
      expect(data.phones).toEqual([]);
      expect(data.urls).toEqual([]);
      expect(data.addresses).toEqual([]);
    });
  });

  describe('generateContactSection', () => {
    it('should generate Contact section markdown', () => {
      const data = {
        emails: [
          { type: 'work', value: 'john@work.com' },
          { value: 'john@personal.com' }
        ],
        phones: [
          { type: 'cell', value: '555-1234' }
        ],
        urls: [],
        addresses: []
      };
      
      const markdown = generateContactSection(data);
      
      expect(markdown).toContain('## Contact');
      expect(markdown).toContain('work john@work.com');
      expect(markdown).toContain('john@personal.com');
      expect(markdown).toContain('cell 555-1234');
    });
  });

  describe('extractHeadings', () => {
    it('should extract all headings', () => {
      const content = `# Title

## Section 1

### Subsection

## Section 2`;

      const headings = extractHeadings(content);
      
      expect(headings).toHaveLength(4);
      expect(headings[0].level).toBe(1);
      expect(headings[0].text).toBe('Title');
      expect(headings[1].level).toBe(2);
      expect(headings[1].text).toBe('Section 1');
      expect(headings[2].level).toBe(3);
      expect(headings[2].text).toBe('Subsection');
    });
  });

  describe('findSectionByHeading', () => {
    it('should find section content', () => {
      const content = `# Title

## Notes

Some notes here.

## Other Section`;

      const section = findSectionByHeading(content, 'Notes');
      
      expect(section).toContain('Some notes here');
      expect(section).not.toContain('## Other Section');
    });

    it('should return null if heading not found', () => {
      const content = '# Title\n\nContent';
      
      const section = findSectionByHeading(content, 'Missing');
      
      expect(section).toBeNull();
    });
  });

  describe('replaceSectionByHeading', () => {
    it('should replace section content', () => {
      const content = `# Title

## Notes

Old content

## Other`;

      const updated = replaceSectionByHeading(content, 'Notes', 'New content');
      
      expect(updated).toContain('New content');
      expect(updated).not.toContain('Old content');
      expect(updated).toContain('## Other');
    });

    it('should append section if heading not found', () => {
      const content = '# Title\n\nContent';
      
      const updated = replaceSectionByHeading(content, 'Notes', '## Notes\n\nNew notes');
      
      expect(updated).toContain('## Notes');
      expect(updated).toContain('New notes');
    });
  });
});
