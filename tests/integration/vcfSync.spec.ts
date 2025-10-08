/**
 * Integration tests for VCF sync workflows
 * Tests the complete flow from VCF file to Obsidian frontmatter and back
 */

import { describe, it, expect } from 'vitest';
import { VcardFile } from '../../src/models/vcardFile';
import { parseFrontmatter, generateFrontmatter } from '../../src/models/contactNote/frontmatter';

describe('VCF Sync Integration', () => {
    describe('VCF to Frontmatter Sync', () => {
        it('should convert VCF contact to frontmatter and back without data loss', () => {
            // Create a VCF contact with basic fields
            const vcfContent = [
                'BEGIN:VCARD',
                'VERSION:4.0',
                'UID:test-uid-123',
                'FN:John Doe',
                'EMAIL;TYPE=work:john.doe@example.com',
                'TEL;TYPE=cell:+1-555-0123',
                'GENDER:M',
                'RELATED;TYPE=friend:urn:uuid:friend-uid-456',
                'END:VCARD',
                ''
            ].join('\r\n');

            // Parse VCF to get flat frontmatter data
            const vcfFile = VcardFile.fromString(vcfContent);
            const contacts = vcfFile.getAllContacts();
            expect(contacts).toHaveLength(1);
            
            const frontmatterData = contacts[0];
            expect(frontmatterData['UID']).toBe('test-uid-123');
            expect(frontmatterData['FN']).toBe('John Doe');
            expect(frontmatterData['EMAIL.WORK']).toBe('john.doe@example.com');
            expect(frontmatterData['TEL.CELL']).toBe('+1-555-0123');
            expect(frontmatterData['GENDER']).toBe('M');
            expect(frontmatterData['RELATED.FRIEND']).toBe('urn:uuid:friend-uid-456');

            // Generate YAML frontmatter
            const yamlContent = generateFrontmatter(frontmatterData);
            expect(yamlContent).toContain('UID: test-uid-123');
            expect(yamlContent).toContain('FN: John Doe');

            // Parse back to frontmatter data
            const parsedData = parseFrontmatter(`---\n${yamlContent}---\n\nBody content`);
            expect(parsedData['UID']).toBe('test-uid-123');
            expect(parsedData['FN']).toBe('John Doe');

            // Convert back to VCF
            const newVcfFile = VcardFile.empty();
            newVcfFile.addContact(parsedData);
            const newVcfContent = newVcfFile.toVCardString();
            
            // Verify round-trip preserves core data
            expect(newVcfContent).toContain('UID:test-uid-123');
            expect(newVcfContent).toContain('FN:John Doe');
        });

        it('should handle multiple contacts in VCF file', () => {
            const vcfContent = [
                'BEGIN:VCARD',
                'VERSION:4.0',
                'UID:uid-1',
                'FN:Alice Smith',
                'END:VCARD',
                'BEGIN:VCARD',
                'VERSION:4.0',
                'UID:uid-2',
                'FN:Bob Jones',
                'END:VCARD',
                ''
            ].join('\r\n');

            const vcfFile = VcardFile.fromString(vcfContent);
            const contacts = vcfFile.getAllContacts();
            
            expect(contacts).toHaveLength(2);
            expect(contacts[0]['FN']).toBe('Alice Smith');
            expect(contacts[1]['FN']).toBe('Bob Jones');
        });
    });

    describe('Frontmatter to VCF Sync', () => {
        it('should create VCF from frontmatter data', () => {
            const frontmatterData = {
                'UID': 'new-contact-uid',
                'FN': 'Jane Doe',
                'EMAIL.work': 'jane@work.com',
                'EMAIL.personal': 'jane@personal.com',
                'TEL.cell': '+1-555-9999',
                'GENDER': 'F'
            };

            const vcfFile = VcardFile.empty();
            vcfFile.addContact(frontmatterData);
            const vcfContent = vcfFile.toVCardString();

            expect(vcfContent).toContain('BEGIN:VCARD');
            expect(vcfContent).toContain('VERSION:4.0');
            expect(vcfContent).toContain('UID:new-contact-uid');
            expect(vcfContent).toContain('FN:Jane Doe');
            expect(vcfContent).toContain('EMAIL;TYPE=work:jane@work.com');
            expect(vcfContent).toContain('EMAIL;TYPE=personal:jane@personal.com');
            expect(vcfContent).toContain('TEL;TYPE=cell:+1-555-9999');
            expect(vcfContent).toContain('GENDER:F');
            expect(vcfContent).toContain('END:VCARD');
        });

        it('should update existing VCF contact', () => {
            const vcfFile = VcardFile.fromString([
                'BEGIN:VCARD',
                'VERSION:4.0',
                'UID:update-test',
                'FN:Original Name',
                'EMAIL;TYPE=work:old@email.com',
                'END:VCARD',
                ''
            ].join('\r\n'));

            // Update the contact
            const updatedData = {
                'UID': 'update-test',
                'FN': 'Updated Name',
                'EMAIL.work': 'new@email.com',
                'TEL.cell': '+1-555-1234'
            };

            vcfFile.removeContact('update-test');
            vcfFile.addContact(updatedData);
            
            const vcfContent = vcfFile.toVCardString();
            expect(vcfContent).toContain('FN:Updated Name');
            expect(vcfContent).toContain('EMAIL;TYPE=work:new@email.com');
            expect(vcfContent).toContain('TEL;TYPE=cell:+1-555-1234');
            expect(vcfContent).not.toContain('old@email.com');
        });
    });

    describe('Bidirectional Sync', () => {
        it('should maintain data integrity through multiple sync cycles', () => {
            // Start with VCF
            let vcfContent = [
                'BEGIN:VCARD',
                'VERSION:4.0',
                'UID:cycle-test',
                'FN:Cycle Test',
                'EMAIL;TYPE=work:test@work.com',
                'END:VCARD',
                ''
            ].join('\r\n');

            // VCF -> Frontmatter (cycle 1)
            let vcfFile = VcardFile.fromString(vcfContent);
            let frontmatterData = vcfFile.getAllContacts()[0];
            expect(frontmatterData['EMAIL.WORK']).toBe('test@work.com');

            // Add field in frontmatter
            frontmatterData['TEL.cell'] = '+1-555-0000';

            // Frontmatter -> VCF (cycle 2)
            vcfFile = VcardFile.empty();
            vcfFile.addContact(frontmatterData);
            vcfContent = vcfFile.toVCardString();
            expect(vcfContent).toContain('TEL;TYPE=cell:+1-555-0000');

            // VCF -> Frontmatter (cycle 3)
            vcfFile = VcardFile.fromString(vcfContent);
            frontmatterData = vcfFile.getAllContacts()[0];
            expect(frontmatterData['EMAIL.WORK']).toBe('test@work.com');
            expect(frontmatterData['TEL.CELL']).toBe('+1-555-0000');

            // Verify both fields present after multiple cycles
            expect(frontmatterData).toHaveProperty('EMAIL.WORK');
            expect(frontmatterData).toHaveProperty('TEL.CELL');
        });

        it('should handle relationship fields in sync', () => {
            const vcfContent = [
                'BEGIN:VCARD',
                'VERSION:4.0',
                'UID:contact-with-relationships',
                'FN:Person with Friends',
                'RELATED;TYPE=friend:urn:uuid:friend-uid-1',
                'RELATED;TYPE=colleague:urn:uuid:colleague-uid-2',
                'END:VCARD',
                ''
            ].join('\r\n');

            const vcfFile = VcardFile.fromString(vcfContent);
            const contact = vcfFile.getAllContacts()[0];

            // Verify relationships are parsed
            expect(contact['RELATED.FRIEND']).toBe('urn:uuid:friend-uid-1');
            expect(contact['RELATED.COLLEAGUE']).toBe('urn:uuid:colleague-uid-2');

            // Round-trip
            const newVcfFile = VcardFile.empty();
            newVcfFile.addContact(contact);
            const newVcfContent = newVcfFile.toVCardString();

            expect(newVcfContent).toContain('RELATED;TYPE=friend:urn:uuid:friend-uid-1');
            expect(newVcfContent).toContain('RELATED;TYPE=colleague:urn:uuid:colleague-uid-2');
        });
    });
});

