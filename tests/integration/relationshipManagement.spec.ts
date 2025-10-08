/**
 * Integration tests for relationship management workflows
 * Tests bidirectional relationship sync, gender-aware processing, and consistency validation
 */

import { describe, it, expect } from 'vitest';
import { parseRelatedSection, generateRelatedSection, parseRelatedFrontmatter, generateRelatedFrontmatter, normalizeRelType, getGenderedRelType, inferGenderFromRelType } from '../../src/models/contactNote/relationships';
import { parseFrontmatter, generateFrontmatter } from '../../src/models/contactNote/frontmatter';
import { getReverseRelationshipType, isSymmetricRelationship, normalizeRelationshipType } from '../../src/models/contactManager/relationships';

describe('Relationship Management Integration', () => {
    describe('Bidirectional Relationship Sync', () => {
        it('should maintain consistency in bidirectional relationships', () => {
            // Get reverse relationship type for friend (symmetric)
            const reverseType = getReverseRelationshipType('friend');
            expect(reverseType).toBe('friend'); // friend is symmetric

            expect(isSymmetricRelationship('friend')).toBe(true);
        });

        it('should handle asymmetric relationships correctly', () => {
            // Alice is parent of Bob
            const reverseType = getReverseRelationshipType('parent');
            expect(reverseType).toBe('child');

            expect(isSymmetricRelationship('parent')).toBe(false);
        });
    });

    describe('Gender-Aware Processing', () => {
        it('should normalize gendered relationship types', () => {
            expect(normalizeRelType('mother')).toBe('parent');
            expect(normalizeRelType('father')).toBe('parent');
            expect(normalizeRelType('parent')).toBe('parent');

            expect(normalizeRelType('brother')).toBe('sibling');
            expect(normalizeRelType('sister')).toBe('sibling');
            expect(normalizeRelType('sibling')).toBe('sibling');

            expect(normalizeRelType('son')).toBe('child');
            expect(normalizeRelType('daughter')).toBe('child');
            expect(normalizeRelType('child')).toBe('child');
        });

        it('should get gendered relationship types based on gender', () => {
            expect(getGenderedRelType('parent', 'M')).toBe('father');
            expect(getGenderedRelType('parent', 'F')).toBe('mother');
            expect(getGenderedRelType('parent', '')).toBe('parent');

            expect(getGenderedRelType('sibling', 'M')).toBe('brother');
            expect(getGenderedRelType('sibling', 'F')).toBe('sister');

            expect(getGenderedRelType('child', 'M')).toBe('son');
            expect(getGenderedRelType('child', 'F')).toBe('daughter');
        });

        it('should infer gender from relationship types', () => {
            expect(inferGenderFromRelType('mother')).toBe('F');
            expect(inferGenderFromRelType('father')).toBe('M');
            expect(inferGenderFromRelType('sister')).toBe('F');
            expect(inferGenderFromRelType('brother')).toBe('M');
            expect(inferGenderFromRelType('daughter')).toBe('F');
            expect(inferGenderFromRelType('son')).toBe('M');

            expect(inferGenderFromRelType('parent')).toBeUndefined();
            expect(inferGenderFromRelType('friend')).toBeUndefined();
        });

        it('should store genderless, display gendered workflow', () => {
            // User enters "mother" in Related section
            const relType = 'mother';

            // Infer gender from relationship type
            const inferredGender = inferGenderFromRelType(relType);
            expect(inferredGender).toBe('F');

            // Normalize to genderless for storage
            const normalizedType = normalizeRelType(relType);
            expect(normalizedType).toBe('parent');

            // When displaying, use gender to show gendered term
            const displayType = getGenderedRelType(normalizedType, inferredGender!);
            expect(displayType).toBe('mother');
        });
    });

    describe('Complete Relationship Workflow', () => {
        it('should handle relationship normalization and display', () => {
            // Step 1: Parse relationship type "daughter"
            const relType = 'daughter';

            // Step 2: Infer gender from relationship (daughter -> F)
            const inferredGender = inferGenderFromRelType(relType);
            expect(inferredGender).toBe('F');

            // Step 3: Normalize to genderless for storage
            const normalizedType = normalizeRelType(relType);
            expect(normalizedType).toBe('child');

            // Step 4: Get reverse relationship
            const reverseType = getReverseRelationshipType(normalizedType);
            expect(reverseType).toBe('parent');

            // Step 5: When displaying, use gender to show gendered term
            const displayType = getGenderedRelType('parent', inferredGender!);
            expect(displayType).toBe('mother'); // Shows "mother" because person is Female
        });

        it('should handle manager-report relationships', () => {
            const managerType = 'manager';
            const reportType = getReverseRelationshipType(managerType);
            
            expect(reportType).toBe('report');
            expect(isSymmetricRelationship(managerType)).toBe(false);
        });

        it('should handle sibling relationships', () => {
            const siblingType = 'sibling';
            const reverseType = getReverseRelationshipType(siblingType);
            
            expect(reverseType).toBe('sibling');
            expect(isSymmetricRelationship(siblingType)).toBe(true);

            // Gender variants
            expect(normalizeRelType('brother')).toBe('sibling');
            expect(normalizeRelType('sister')).toBe('sibling');
            expect(getGenderedRelType('sibling', 'M')).toBe('brother');
            expect(getGenderedRelType('sibling', 'F')).toBe('sister');
        });
    });
});
