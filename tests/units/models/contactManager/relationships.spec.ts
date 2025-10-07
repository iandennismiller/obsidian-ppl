/**
 * Unit tests for ContactManager relationship operations
 */

import { describe, it, expect } from 'vitest';
import {
  getReverseRelationshipType,
  isSymmetricRelationship,
  normalizeRelationshipTypeForComparison,
  validateRelationshipPair,
  getPossibleReverseTypes
} from '../../../../src/models/contactManager/relationships';

describe('ContactManager Relationship Operations', () => {
  describe('getReverseRelationshipType', () => {
    it('should return reverse for family relationships', () => {
      expect(getReverseRelationshipType('parent')).toBe('child');
      expect(getReverseRelationshipType('child')).toBe('parent');
      expect(getReverseRelationshipType('sibling')).toBe('sibling');
    });

    it('should handle gendered family relationships', () => {
      expect(getReverseRelationshipType('mother')).toBe('child');
      expect(getReverseRelationshipType('father')).toBe('child');
      expect(getReverseRelationshipType('son')).toBe('parent');
      expect(getReverseRelationshipType('daughter')).toBe('parent');
    });

    it('should return reverse for professional relationships', () => {
      expect(getReverseRelationshipType('manager')).toBe('report');
      expect(getReverseRelationshipType('mentor')).toBe('mentee');
      expect(getReverseRelationshipType('colleague')).toBe('colleague');
    });

    it('should return original type for unknown relationships', () => {
      expect(getReverseRelationshipType('custom')).toBe('custom');
    });
  });

  describe('isSymmetricRelationship', () => {
    it('should identify symmetric relationships', () => {
      expect(isSymmetricRelationship('friend')).toBe(true);
      expect(isSymmetricRelationship('sibling')).toBe(true);
      expect(isSymmetricRelationship('colleague')).toBe(true);
    });

    it('should identify non-symmetric relationships', () => {
      expect(isSymmetricRelationship('parent')).toBe(false);
      expect(isSymmetricRelationship('manager')).toBe(false);
      expect(isSymmetricRelationship('mentor')).toBe(false);
    });
  });

  describe('normalizeRelationshipTypeForComparison', () => {
    it('should normalize gendered types to genderless', () => {
      expect(normalizeRelationshipTypeForComparison('mother')).toBe('parent');
      expect(normalizeRelationshipTypeForComparison('father')).toBe('parent');
      expect(normalizeRelationshipTypeForComparison('sister')).toBe('sibling');
      expect(normalizeRelationshipTypeForComparison('brother')).toBe('sibling');
    });

    it('should leave genderless types unchanged', () => {
      expect(normalizeRelationshipTypeForComparison('friend')).toBe('friend');
      expect(normalizeRelationshipTypeForComparison('colleague')).toBe('colleague');
    });
  });

  describe('validateRelationshipPair', () => {
    it('should validate correct relationship pairs', () => {
      expect(validateRelationshipPair('parent', 'child')).toBe(true);
      expect(validateRelationshipPair('manager', 'report')).toBe(true);
      expect(validateRelationshipPair('friend', 'friend')).toBe(true);
    });

    it('should validate gendered relationship pairs', () => {
      expect(validateRelationshipPair('mother', 'son')).toBe(true);
      expect(validateRelationshipPair('father', 'daughter')).toBe(true);
    });

    it('should reject incorrect relationship pairs', () => {
      expect(validateRelationshipPair('parent', 'sibling')).toBe(false);
      expect(validateRelationshipPair('manager', 'colleague')).toBe(false);
    });
  });

  describe('getPossibleReverseTypes', () => {
    it('should return base reverse type', () => {
      const types = getPossibleReverseTypes('parent');
      
      expect(types).toContain('child');
    });

    it('should include gendered variants', () => {
      const types = getPossibleReverseTypes('parent');
      
      expect(types).toContain('child');
      expect(types).toContain('son');
      expect(types).toContain('daughter');
    });

    it('should return only base type for non-gendered relationships', () => {
      const types = getPossibleReverseTypes('friend');
      
      expect(types).toEqual(['friend']);
    });
  });
});
