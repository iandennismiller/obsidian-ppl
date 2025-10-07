/**
 * Unit tests for VcardFile model
 */

import { describe, it, expect } from 'vitest';
import { VcardFile } from '../../../../src/models/vcardFile';
import { parseVcfFile, parseVcfContact } from '../../../../src/models/vcardFile/parsing';
import { generateVcfFile, generateVcfContact } from '../../../../src/models/vcardFile/generation';

describe('VcardFile', () => {
  describe('VcardFile class', () => {
    it('should create an empty VcardFile', () => {
      const vcf = VcardFile.empty();
      expect(vcf).toBeDefined();
      expect(vcf.isEmpty()).toBe(true);
      expect(vcf.count).toBe(0);
    });

    it('should create VcardFile with filename', () => {
      const vcf = VcardFile.empty('test.vcf');
      expect(vcf.filename).toBe('test.vcf');
    });

    it('should add a contact', () => {
      const vcf = VcardFile.empty();
      const contact = {
        UID: 'test-uid-123',
        FN: 'John Doe'
      };
      
      vcf.addContact(contact);
      
      expect(vcf.count).toBe(1);
      expect(vcf.hasContact('test-uid-123')).toBe(true);
      expect(vcf.getContact('test-uid-123')).toEqual(contact);
    });

    it('should throw error when adding contact without UID', () => {
      const vcf = VcardFile.empty();
      const invalidContact = { FN: 'John Doe' } as any;
      
      expect(() => vcf.addContact(invalidContact)).toThrow('missing UID');
    });

    it('should throw error when adding contact without FN', () => {
      const vcf = VcardFile.empty();
      const invalidContact = { UID: 'test-uid' } as any;
      
      expect(() => vcf.addContact(invalidContact)).toThrow('missing FN');
    });

    it('should update existing contact when adding with same UID', () => {
      const vcf = VcardFile.empty();
      const contact1 = { UID: 'test-uid', FN: 'John Doe' };
      const contact2 = { UID: 'test-uid', FN: 'Jane Doe' };
      
      vcf.addContact(contact1);
      vcf.addContact(contact2);
      
      expect(vcf.count).toBe(1);
      expect(vcf.getContact('test-uid')?.FN).toBe('Jane Doe');
    });

    it('should remove a contact', () => {
      const vcf = VcardFile.empty();
      vcf.addContact({ UID: 'test-uid', FN: 'John Doe' });
      
      const removed = vcf.removeContact('test-uid');
      
      expect(removed).toBe(true);
      expect(vcf.count).toBe(0);
      expect(vcf.hasContact('test-uid')).toBe(false);
    });

    it('should return false when removing non-existent contact', () => {
      const vcf = VcardFile.empty();
      const removed = vcf.removeContact('non-existent');
      
      expect(removed).toBe(false);
    });

    it('should get all contacts', () => {
      const vcf = VcardFile.empty();
      vcf.addContact({ UID: 'uid1', FN: 'John Doe' });
      vcf.addContact({ UID: 'uid2', FN: 'Jane Doe' });
      
      const contacts = vcf.getAllContacts();
      
      expect(contacts).toHaveLength(2);
      expect(contacts[0].UID).toBe('uid1');
      expect(contacts[1].UID).toBe('uid2');
    });

    it('should get all UIDs', () => {
      const vcf = VcardFile.empty();
      vcf.addContact({ UID: 'uid1', FN: 'John Doe' });
      vcf.addContact({ UID: 'uid2', FN: 'Jane Doe' });
      
      const uids = vcf.getUIDs();
      
      expect(uids).toEqual(['uid1', 'uid2']);
    });

    it('should clear all contacts', () => {
      const vcf = VcardFile.empty();
      vcf.addContact({ UID: 'uid1', FN: 'John Doe' });
      vcf.addContact({ UID: 'uid2', FN: 'Jane Doe' });
      
      vcf.clear();
      
      expect(vcf.isEmpty()).toBe(true);
      expect(vcf.count).toBe(0);
    });
  });

  describe('Parsing', () => {
    it('should parse a simple vCard', () => {
      const vcfContent = `BEGIN:VCARD\r
VERSION:4.0\r
UID:test-uid-123\r
FN:John Doe\r
END:VCARD\r
`;

      const contacts = parseVcfFile(vcfContent);
      
      expect(contacts).toHaveLength(1);
      expect(contacts[0].UID).toBe('test-uid-123');
      expect(contacts[0].FN).toBe('John Doe');
    });

    it('should parse multiple vCards', () => {
      const vcfContent = `BEGIN:VCARD\r
VERSION:4.0\r
UID:uid1\r
FN:John Doe\r
END:VCARD\r
BEGIN:VCARD\r
VERSION:4.0\r
UID:uid2\r
FN:Jane Doe\r
END:VCARD\r
`;

      const contacts = parseVcfFile(vcfContent);
      
      expect(contacts).toHaveLength(2);
      expect(contacts[0].UID).toBe('uid1');
      expect(contacts[1].UID).toBe('uid2');
    });

    it('should return empty array for empty content', () => {
      const contacts = parseVcfFile('');
      expect(contacts).toEqual([]);
    });

    it('should handle invalid vCard gracefully', () => {
      const invalidVcf = 'INVALID CONTENT';
      const contacts = parseVcfFile(invalidVcf);
      
      // Should return empty array or skip invalid entries
      expect(Array.isArray(contacts)).toBe(true);
    });
  });

  describe('Generation', () => {
    it('should generate a simple vCard', () => {
      const contact = {
        UID: 'test-uid-123',
        FN: 'John Doe'
      };

      const vcfString = generateVcfContact(contact);
      
      expect(vcfString).toContain('BEGIN:VCARD');
      expect(vcfString).toContain('VERSION:4.0');
      expect(vcfString).toContain('UID:test-uid-123');
      expect(vcfString).toContain('FN:John Doe');
      expect(vcfString).toContain('END:VCARD');
    });

    it('should generate multiple vCards', () => {
      const contacts = [
        { UID: 'uid1', FN: 'John Doe' },
        { UID: 'uid2', FN: 'Jane Doe' }
      ];

      const vcfString = generateVcfFile(contacts);
      
      expect(vcfString).toContain('UID:uid1');
      expect(vcfString).toContain('UID:uid2');
      expect(vcfString).toContain('FN:John Doe');
      expect(vcfString).toContain('FN:Jane Doe');
    });

    it('should throw error when generating vCard without UID', () => {
      const invalidContact = { FN: 'John Doe' } as any;
      
      expect(() => generateVcfContact(invalidContact)).toThrow('missing UID');
    });

    it('should throw error when generating vCard without FN', () => {
      const invalidContact = { UID: 'test-uid' } as any;
      
      expect(() => generateVcfContact(invalidContact)).toThrow('missing FN');
    });

    it('should return empty string for empty contacts array', () => {
      const vcfString = generateVcfFile([]);
      expect(vcfString).toBe('');
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve UID and FN through parse-generate cycle', () => {
      const original = {
        UID: 'test-uid-123',
        FN: 'John Doe'
      };

      const vcfString = generateVcfContact(original);
      const parsed = parseVcfContact(vcfString);
      
      expect(parsed).toBeDefined();
      expect(parsed?.UID).toBe(original.UID);
      expect(parsed?.FN).toBe(original.FN);
    });

    it('should handle fromString and toVCardString', () => {
      const vcfContent = `BEGIN:VCARD\r
VERSION:4.0\r
UID:test-uid\r
FN:John Doe\r
END:VCARD\r
`;

      const vcf = VcardFile.fromString(vcfContent);
      const generated = vcf.toVCardString();
      
      expect(generated).toContain('UID:test-uid');
      expect(generated).toContain('FN:John Doe');
    });
  });

  describe('Integration with VcardFile class', () => {
    it('should parse VCF content and create VcardFile', () => {
      const vcfContent = `BEGIN:VCARD\r
VERSION:4.0\r
UID:uid1\r
FN:John Doe\r
END:VCARD\r
BEGIN:VCARD\r
VERSION:4.0\r
UID:uid2\r
FN:Jane Doe\r
END:VCARD\r
`;

      const vcf = VcardFile.fromString(vcfContent);
      
      expect(vcf.count).toBe(2);
      expect(vcf.hasContact('uid1')).toBe(true);
      expect(vcf.hasContact('uid2')).toBe(true);
    });

    it('should generate VCF content from VcardFile', () => {
      const vcf = VcardFile.empty();
      vcf.addContact({ UID: 'uid1', FN: 'John Doe' });
      vcf.addContact({ UID: 'uid2', FN: 'Jane Doe' });
      
      const vcfString = vcf.toVCardString();
      
      expect(vcfString).toContain('UID:uid1');
      expect(vcfString).toContain('UID:uid2');
      expect(vcfString).toContain('FN:John Doe');
      expect(vcfString).toContain('FN:Jane Doe');
    });

    it('should add contact from string', () => {
      const vcf = VcardFile.empty();
      const vcardString = `BEGIN:VCARD\r
VERSION:4.0\r
UID:test-uid\r
FN:John Doe\r
END:VCARD\r
`;

      const added = vcf.addFromString(vcardString);
      
      expect(added).toBe(true);
      expect(vcf.count).toBe(1);
      expect(vcf.hasContact('test-uid')).toBe(true);
    });
  });
});
