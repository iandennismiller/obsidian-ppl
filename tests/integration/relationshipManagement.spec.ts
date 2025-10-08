/**
 * Integration tests for relationship management workflows
 * Tests bidirectional relationship sync, gender-aware processing, and consistency validation
 */

import { describe, it, expect } from 'vitest';
import { parseRelatedSection, generateRelatedSection, parseRelatedFrontmatter, generateRelatedFrontmatter, normalizeRelationshipType, getGenderedRelationshipType, inferGenderFromType } from '../../src/models/contactNote/relationships';
import { parseFrontmatter, generateFrontmatter } from '../../src/models/contactNote/frontmatter';
import { getReverseRelationshipType, isSymmetricRelationship, normalizeRelationshipType as normalizeForComparison } from '../../src/models/contactManager/relationships';

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
            expect(normalizeRelationshipType('mother')).toBe('parent');
            expect(normalizeRelationshipType('father')).toBe('parent');
            expect(normalizeRelationshipType('parent')).toBe('parent');

            expect(normalizeRelationshipType('brother')).toBe('sibling');
            expect(normalizeRelationshipType('sister')).toBe('sibling');
            expect(normalizeRelationshipType('sibling')).toBe('sibling');

            expect(normalizeRelationshipType('son')).toBe('child');
            expect(normalizeRelationshipType('daughter')).toBe('child');
            expect(normalizeRelationshipType('child')).toBe('child');
        });

        it('should get gendered relationship types based on gender', () => {
            expect(getGenderedRelationshipType('parent', 'M')).toBe('father');
            expect(getGenderedRelationshipType('parent', 'F')).toBe('mother');
            expect(getGenderedRelationshipType('parent', '')).toBe('parent');

            expect(getGenderedRelationshipType('sibling', 'M')).toBe('brother');
            expect(getGenderedRelationshipType('sibling', 'F')).toBe('sister');

            expect(getGenderedRelationshipType('child', 'M')).toBe('son');
            expect(getGenderedRelationshipType('child', 'F')).toBe('daughter');
        });

        it('should infer gender from relationship types', () => {
            expect(inferGenderFromType('mother')).toBe('F');
            expect(inferGenderFromType('father')).toBe('M');
            expect(inferGenderFromType('sister')).toBe('F');
            expect(inferGenderFromType('brother')).toBe('M');
            expect(inferGenderFromType('daughter')).toBe('F');
            expect(inferGenderFromType('son')).toBe('M');

            expect(inferGenderFromType('parent')).toBeUndefined();
            expect(inferGenderFromType('friend')).toBeUndefined();
        });

        it('should store genderless, display gendered workflow', () => {
            // User enters "mother" in Related section
            const relType = 'mother';

            // Infer gender from relationship type
            const inferredGender = inferGenderFromType(relType);
            expect(inferredGender).toBe('F');

            // Normalize to genderless for storage
            const normalizedType = normalizeRelationshipType(relType);
            expect(normalizedType).toBe('parent');

            // When displaying, use gender to show gendered term
            const displayType = getGenderedRelationshipType(normalizedType, inferredGender!);
            expect(displayType).toBe('mother');
        });
    });

    describe('Complete Relationship Workflow', () => {
        it('should handle relationship normalization and display', () => {
            // Step 1: Parse relationship type "daughter"
            const relType = 'daughter';

            // Step 2: Infer gender from relationship (daughter -> F)
            const inferredGender = inferGenderFromType(relType);
            expect(inferredGender).toBe('F');

            // Step 3: Normalize to genderless for storage
            const normalizedType = normalizeRelationshipType(relType);
            expect(normalizedType).toBe('child');

            // Step 4: Get reverse relationship
            const reverseType = getReverseRelationshipType(normalizedType);
            expect(reverseType).toBe('parent');

            // Step 5: When displaying, use gender to show gendered term
            const displayType = getGenderedRelationshipType('parent', inferredGender!);
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
            expect(normalizeRelationshipType('brother')).toBe('sibling');
            expect(normalizeRelationshipType('sister')).toBe('sibling');
            expect(getGenderedRelationshipType('sibling', 'M')).toBe('brother');
            expect(getGenderedRelationshipType('sibling', 'F')).toBe('sister');
        });
    });
});
