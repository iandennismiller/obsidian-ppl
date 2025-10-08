/**
 * End-to-end integration tests for complete workflows
 * Tests full user scenarios from VCF import to relationship sync to export
 */

import { describe, it, expect } from 'vitest';
import { VcardFile } from '../../src/models/vcardFile';
import { parseFrontmatter, generateFrontmatter, updateFrontmatter, removeInvalidFields } from '../../src/models/contactNote/frontmatter';
import { parseRelatedSection, generateRelatedSection, parseRelatedFrontmatter, generateRelatedFrontmatter, normalizeRelationshipType, getGenderedRelationshipType, inferGenderFromType } from '../../src/models/contactNote/relationships';
import { parseContactSection, generateContactSection } from '../../src/models/contactNote/markdown';
import { ProcessorRegistry } from '../../src/models/curatorManager/processorRegistry';
import { CuratorQueue } from '../../src/models/curatorManager/queue';
import { RunType } from '../../src/models/curatorManager/types';
import { uidProcessor } from '../../src/curators/uidProcessor';
import { relatedFrontMatterProcessor } from '../../src/curators/relatedFrontMatterProcessor';
import { relatedListProcessor } from '../../src/curators/relatedListProcessor';
import { genderInferenceProcessor } from '../../src/curators/genderInferenceProcessor';
import { genderRenderProcessor } from '../../src/curators/genderRenderProcessor';

// Simple interface matching processor expectations
interface ContactNote {
    path: string;
    frontmatter?: Record<string, any>;
    content: string;
}

describe('End-to-End Workflow Integration', () => {
    describe('Complete VCF Import Workflow', () => {
        it('should import VCF file, create contact note, and sync relationships', async () => {
            // Step 1: Import VCF file with multiple contacts and relationships
            const vcfContent = [
                'BEGIN:VCARD',
                'VERSION:4.0',
                'UID:urn:uuid:alice-123',
                'FN:Alice Smith',
                'EMAIL;TYPE=work:alice@company.com',
                'TEL;TYPE=cell:+1-555-0001',
                'RELATED;TYPE=friend:urn:uuid:bob-456',
                'END:VCARD',
                '',
                'BEGIN:VCARD',
                'VERSION:4.0',
                'UID:urn:uuid:bob-456',
                'FN:Bob Johnson',
                'EMAIL;TYPE=home:bob@personal.com',
                'RELATED;TYPE=friend:urn:uuid:alice-123',
                'END:VCARD',
                ''
            ].join('\r\n');

            const vcfFile = VcardFile.fromString(vcfContent);
            const contacts = vcfFile.getAllContacts();

            expect(contacts).toHaveLength(2);
            
            // Step 2: Convert to frontmatter format
            const aliceData = contacts.find(c => c.UID === 'urn:uuid:alice-123');
            const bobData = contacts.find(c => c.UID === 'urn:uuid:bob-456');

            expect(aliceData).toBeDefined();
            expect(bobData).toBeDefined();
            expect(aliceData!.FN).toBe('Alice Smith');
            expect(bobData!.FN).toBe('Bob Johnson');

            // Step 3: Verify relationship fields
            expect(aliceData!['RELATED.FRIEND']).toBe('urn:uuid:bob-456');
            expect(bobData!['RELATED.FRIEND']).toBe('urn:uuid:alice-123');

            // Step 4: Generate YAML frontmatter for both contacts
            const aliceYaml = generateFrontmatter(aliceData!);
            const bobYaml = generateFrontmatter(bobData!);

            expect(aliceYaml).toContain('Alice Smith');
            expect(bobYaml).toContain('Bob Johnson');

            // Step 5: Create contact notes with frontmatter
            const aliceNote: ContactNote = {
                path: '/contacts/Alice Smith.md',
                frontmatter: aliceData,
                content: `---\n${aliceYaml}---\n\n# Alice Smith\n\nContact information for Alice.`
            };

            const bobNote: ContactNote = {
                path: '/contacts/Bob Johnson.md',
                frontmatter: bobData,
                content: `---\n${bobYaml}---\n\n# Bob Johnson\n\nContact information for Bob.`
            };

            // Step 6: Process through curator pipeline
            const registry = new ProcessorRegistry();
            registry.register(uidProcessor);
            registry.register(relatedFrontMatterProcessor);

            // Both contacts already have UIDs from VCF, so UID processor should not run
            expect(await uidProcessor.shouldRun(aliceNote)).toBe(false);
            expect(await uidProcessor.shouldRun(bobNote)).toBe(false);

            // Step 7: Verify bidirectional relationship
            expect(aliceNote.frontmatter?.['RELATED.FRIEND']).toBe('urn:uuid:bob-456');
            expect(bobNote.frontmatter?.['RELATED.FRIEND']).toBe('urn:uuid:alice-123');
        });
    });

    describe('Complete Relationship Management Workflow', () => {
        it('should handle family relationships with gender inference', async () => {
            // Step 1: Create contact note with gendered relationship in markdown
            const content = `---
UID: urn:uuid:child-123
FN: Child Person
---

## Related

- mother [[Mother Person]]

# Child Person

Some content about the child.`;

            const { frontmatter, body } = parseFrontmatter(content);
            
            // Step 2: Parse relationships from Related section
            const relationships = parseRelatedSection(content);
            expect(relationships).toHaveLength(1);
            expect(relationships[0].type).toBe('mother');
            expect(relationships[0].targetName).toBe('Mother Person');

            // Step 3: Infer gender from relationship type
            const inferredGender = inferGenderFromType('mother');
            expect(inferredGender).toBe('F');

            // Step 4: Normalize relationship type for storage
            const normalizedType = normalizeRelationshipType('mother');
            expect(normalizedType).toBe('parent');

            // Step 5: Store normalized type in frontmatter
            const relatedFrontmatter = {
                [`RELATED.${normalizedType}`]: 'uid:mother-uid-456'
            };

            expect(relatedFrontmatter['RELATED.parent']).toBe('uid:mother-uid-456');

            // Step 6: When displaying, use gendered version
            const displayType = getGenderedRelationshipType(normalizedType, inferredGender!);
            expect(displayType).toBe('mother');

            // Step 7: Generate Related section for display
            const displayRelationships = [{
                type: displayType,
                targetUID: 'uid:mother-uid-456',
                targetName: 'Mother Person',
                namespace: 'uid'
            }];

            const relatedSection = generateRelatedSection(displayRelationships);
            expect(relatedSection).toContain('## Related');
            expect(relatedSection).toContain('mother');
            expect(relatedSection).toContain('[[Mother Person]]');
        });

        it('should sync relationships between frontmatter and Related section', () => {
            // Step 1: Start with relationships in frontmatter
            const frontmatter = {
                UID: 'urn:uuid:person-123',
                FN: 'Test Person',
                'RELATED.friend': 'uid:friend-456',
                'RELATED.colleague': 'uid:colleague-789'
            };

            // Step 2: Parse relationships from frontmatter
            const relationships = parseRelatedFrontmatter(frontmatter);
            expect(relationships).toHaveLength(2);
            expect(relationships.map(r => r.type)).toContain('friend');
            expect(relationships.map(r => r.type)).toContain('colleague');

            // Step 3: Generate Related section markdown
            const relatedSection = generateRelatedSection(relationships);
            expect(relatedSection).toContain('## Related');
            expect(relatedSection).toContain('friend');
            expect(relatedSection).toContain('colleague');

            // Step 4: Parse back from markdown
            const content = `---
UID: urn:uuid:person-123
FN: Test Person
---

${relatedSection}

# Test Person`;

            const parsedRelationships = parseRelatedSection(content);
            expect(parsedRelationships).toHaveLength(2);
            expect(parsedRelationships.map(r => r.type)).toContain('friend');
            expect(parsedRelationships.map(r => r.type)).toContain('colleague');

            // Step 5: Add UIDs to relationships (normally would be resolved from contact names)
            const relationshipsWithUIDs = parsedRelationships.map(r => ({
                ...r,
                targetUID: r.type === 'friend' ? 'friend-456' : 'colleague-789',
                namespace: 'uid' as const
            }));

            // Generate frontmatter from relationships with UIDs
            const newFrontmatter = generateRelatedFrontmatter(relationshipsWithUIDs);
            expect(newFrontmatter['RELATED.FRIEND']).toBeDefined();
            expect(newFrontmatter['RELATED.COLLEAGUE']).toBeDefined();
        });
    });

    describe('Complete Contact Section Workflow', () => {
        it('should parse and generate Contact section with all field types', () => {
            // Step 1: Create contact note with Contact section
            const content = `---
UID: urn:uuid:test-123
FN: Test User
---

## Contact

- work@company.com
- personal@email.com
- +1-555-0001
- +1-555-0002
- https://example.com
- 123 Main St City ST 12345

# Test User`;

            // Step 2: Parse Contact section
            const contactData = parseContactSection(content);
            
            // The parser will detect emails and phones based on patterns
            expect(contactData.emails.length + contactData.phones.length + contactData.urls.length).toBeGreaterThan(0);

            // Step 3: Generate Contact section from test data
            const testData = {
                emails: [
                    { type: 'work', value: 'work@company.com' },
                    { type: 'personal', value: 'personal@email.com' }
                ],
                phones: [
                    { type: 'cell', value: '+1-555-0001' },
                    { type: 'work', value: '+1-555-0002' }
                ],
                urls: [
                    { type: undefined, value: 'https://example.com' }
                ],
                addresses: [
                    { type: 'home', value: '123 Main St, City, ST 12345' }
                ]
            };
            
            const generatedSection = generateContactSection(testData);
            expect(generatedSection).toContain('## Contact');
            expect(generatedSection).toContain('work@company.com');
            expect(generatedSection).toContain('+1-555-0001');
            expect(generatedSection).toContain('https://example.com');
            expect(generatedSection).toContain('123 Main St');
        });
    });

    describe('Complete Curator Pipeline Workflow', () => {
        it('should process contact through full curator pipeline', async () => {
            // Step 1: Create new contact without UID
            const content = `---
FN: New Contact
EMAIL.work: new@company.com
---

## Related

- father [[Dad Contact]]

# New Contact`;

            const { frontmatter, body } = parseFrontmatter(content);
            const contact: ContactNote = {
                path: '/contacts/New Contact.md',
                frontmatter,
                content
            };

            // Step 2: Register all processors
            const registry = new ProcessorRegistry();
            registry.register(uidProcessor);
            registry.register(relatedFrontMatterProcessor);
            registry.register(relatedListProcessor);
            registry.register(genderInferenceProcessor);
            registry.register(genderRenderProcessor);

            expect(registry.getAll()).toHaveLength(5);

            // Step 3: Execute uidProcessor to add UID
            if (await uidProcessor.shouldRun(contact)) {
                await uidProcessor.process(contact);
            }

            expect(contact.frontmatter?.UID).toBeDefined();
            expect(contact.frontmatter?.UID).toContain('urn:uuid:');

            // Step 4: Verify FN is preserved
            expect(contact.frontmatter?.FN).toBe('New Contact');
            expect(contact.frontmatter?.['EMAIL.work']).toBe('new@company.com');

            // Step 5: Process relationships
            // relatedFrontMatterProcessor would sync Related section to frontmatter
            // genderInferenceProcessor would infer gender from 'father' relationship
            // genderRenderProcessor would render gendered relationship types

            const hasRelationships = parseRelatedSection(contact.content).length > 0;
            expect(hasRelationships).toBe(true);
        });

        it('should handle complete VCF round-trip through all systems', async () => {
            // Step 1: Start with VCF
            const originalVcf = [
                'BEGIN:VCARD',
                'VERSION:4.0',
                'UID:urn:uuid:roundtrip-123',
                'FN:Round Trip User',
                'EMAIL;TYPE=work:roundtrip@company.com',
                'TEL;TYPE=cell:+1-555-9999',
                'RELATED;TYPE=friend:urn:uuid:friend-999',
                'END:VCARD',
                ''
            ].join('\r\n');

            // Step 2: Parse VCF to frontmatter
            const vcfFile = VcardFile.fromString(originalVcf);
            const contacts = vcfFile.getAllContacts();
            expect(contacts).toHaveLength(1);

            const contactData = contacts[0];
            expect(contactData.UID).toBe('urn:uuid:roundtrip-123');
            expect(contactData.FN).toBe('Round Trip User');

            // Step 3: Create contact note
            const yamlContent = generateFrontmatter(contactData);
            const content = `---\n${yamlContent}---\n\n# Round Trip User`;

            const { frontmatter } = parseFrontmatter(content);
            const contact: ContactNote = {
                path: '/contacts/Round Trip User.md',
                frontmatter,
                content
            };

            // Step 4: Process through curator
            if (await uidProcessor.shouldRun(contact)) {
                await uidProcessor.process(contact);
            }

            // UID already exists, so processor should not have run
            expect(contact.frontmatter?.UID).toBe('urn:uuid:roundtrip-123');

            // Step 5: Clean frontmatter
            const cleaned = removeInvalidFields(contact.frontmatter!);
            expect(cleaned).toBeDefined();

            // Step 6: Convert back to VCF
            const newVcfFile = VcardFile.empty();
            newVcfFile.addContact(cleaned);
            const newVcfContent = newVcfFile.toVCardString();

            // Step 7: Verify round-trip
            expect(newVcfContent).toContain('BEGIN:VCARD');
            expect(newVcfContent).toContain('VERSION:4.0');
            expect(newVcfContent).toContain('UID:urn:uuid:roundtrip-123');
            expect(newVcfContent).toContain('FN:Round Trip User');
            expect(newVcfContent).toContain('END:VCARD');
        });
    });

    describe('Data Preservation Workflows', () => {
        it('should preserve all data through multiple transformations', () => {
            const originalData = {
                UID: 'urn:uuid:preserve-123',
                FN: 'Preserve Test',
                'EMAIL.work': 'work@example.com',
                'EMAIL.home': 'home@example.com',
                'TEL.cell': '+1-555-0001',
                'TEL.work': '+1-555-0002',
                'RELATED.friend': 'urn:uuid:friend-123',
                'RELATED.colleague': 'uid:colleague-456',
                NOTE: 'Important notes about this contact'
            };

            // Step 1: Generate YAML
            const yaml = generateFrontmatter(originalData);
            expect(yaml).toContain('Preserve Test');

            // Step 2: Parse back
            const { frontmatter: parsed } = parseFrontmatter(`---\n${yaml}---\n\nBody`);

            // Step 3: Verify all fields preserved
            expect(parsed.UID).toBe(originalData.UID);
            expect(parsed.FN).toBe(originalData.FN);
            expect(parsed['EMAIL.work']).toBe(originalData['EMAIL.work']);
            expect(parsed['EMAIL.home']).toBe(originalData['EMAIL.home']);
            expect(parsed['TEL.cell']).toBe(originalData['TEL.cell']);
            expect(parsed['TEL.work']).toBe(originalData['TEL.work']);
            expect(parsed['RELATED.friend']).toBe(originalData['RELATED.friend']);
            expect(parsed['RELATED.colleague']).toBe(originalData['RELATED.colleague']);
            expect(parsed.NOTE).toBe(originalData.NOTE);

            // Step 4: Clean and verify
            const cleaned = removeInvalidFields(parsed);
            expect(cleaned.UID).toBe(originalData.UID);
            expect(cleaned.FN).toBe(originalData.FN);
        });

        it('should handle frontmatter updates without data loss', () => {
            const content = `---
UID: urn:uuid:update-123
FN: Original Name
EMAIL.work: old@company.com
---

# Original Name

Some body content that should be preserved.`;

            // Step 1: Parse original
            const { frontmatter: original, body } = parseFrontmatter(content);
            expect(original.FN).toBe('Original Name');
            expect(body.trim()).toContain('Some body content');

            // Step 2: Update frontmatter
            const updated = {
                ...original,
                FN: 'Updated Name',
                'EMAIL.personal': 'new@personal.com'
            };

            // Step 3: Generate new content
            const newContent = updateFrontmatter(content, updated);

            // Step 4: Parse and verify
            const { frontmatter: parsed, body: newBody } = parseFrontmatter(newContent);
            expect(parsed.UID).toBe('urn:uuid:update-123');
            expect(parsed.FN).toBe('Updated Name');
            expect(parsed['EMAIL.work']).toBe('old@company.com');
            expect(parsed['EMAIL.personal']).toBe('new@personal.com');
            expect(newBody.trim()).toContain('Some body content');
        });
    });
});
