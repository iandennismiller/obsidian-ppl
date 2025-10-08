/**
 * Relationship synchronization utilities
 * Handles bidirectional relationship management
 */

import { ReverseRelationshipMap } from './types';

/**
 * Get the reverse relationship type
 * @param type - Original relationship type
 * @returns Reverse relationship type
 */
export function getReverseRelationshipType(type: string): string {
  const reverseMap: ReverseRelationshipMap = {
    // Family relationships
    'parent': 'child',
    'child': 'parent',
    'sibling': 'sibling',
    'spouse': 'spouse',
    'partner': 'partner',
    
    // Gendered family relationships
    'mother': 'child',
    'father': 'child',
    'son': 'parent',
    'daughter': 'parent',
    'sister': 'sibling',
    'brother': 'sibling',
    'husband': 'spouse',
    'wife': 'spouse',
    'boyfriend': 'partner',
    'girlfriend': 'partner',
    
    // Extended family
    'grandparent': 'grandchild',
    'grandchild': 'grandparent',
    'grandmother': 'grandchild',
    'grandfather': 'grandchild',
    'grandson': 'grandparent',
    'granddaughter': 'grandparent',
    'aunt': 'niece-nephew',
    'uncle': 'niece-nephew',
    'niece': 'aunt-uncle',
    'nephew': 'aunt-uncle',
    'cousin': 'cousin',
    
    // Professional relationships
    'manager': 'report',
    'report': 'manager',
    'supervisor': 'supervisee',
    'supervisee': 'supervisor',
    'mentor': 'mentee',
    'mentee': 'mentor',
    'colleague': 'colleague',
    'coworker': 'coworker',
    
    // Social relationships
    'friend': 'friend',
    'acquaintance': 'acquaintance',
    'neighbor': 'neighbor',
    'roommate': 'roommate'
  };
  
  const normalizedType = type.toLowerCase();
  return reverseMap[normalizedType] || type;
}

/**
 * Check if a relationship type is symmetric
 * @param type - Relationship type
 * @returns True if symmetric (both directions use same type)
 */
export function isSymmetricRelationship(type: string): boolean {
  const symmetricTypes = [
    'sibling', 'sister', 'brother',
    'spouse', 'husband', 'wife',
    'partner', 'boyfriend', 'girlfriend',
    'cousin',
    'colleague', 'coworker',
    'friend', 'acquaintance', 'neighbor', 'roommate'
  ];
  
  return symmetricTypes.includes(type.toLowerCase());
}

/**
 * Normalize relationship type for comparison
 * @param type - Relationship type
 * @returns Normalized type
 */
export function normalizeRelationshipTypeForComparison(type: string): string {
  // Convert gendered types to genderless for comparison
  const genderlessMap: Record<string, string> = {
    'mother': 'parent',
    'father': 'parent',
    'mom': 'parent',
    'dad': 'parent',
    'son': 'child',
    'daughter': 'child',
    'sister': 'sibling',
    'brother': 'sibling',
    'grandmother': 'grandparent',
    'grandfather': 'grandparent',
    'grandson': 'grandchild',
    'granddaughter': 'grandchild',
    'husband': 'spouse',
    'wife': 'spouse',
    'boyfriend': 'partner',
    'girlfriend': 'partner'
  };
  
  const normalized = type.toLowerCase();
  return genderlessMap[normalized] || normalized;
}

/**
 * Validate if a relationship pair is consistent
 * @param sourceType - Relationship type from source to target
 * @param targetType - Relationship type from target to source
 * @returns True if consistent
 */
export function validateRelationshipPair(sourceType: string, targetType: string): boolean {
  const expectedReverse = getReverseRelationshipType(sourceType);
  const normalizedExpected = normalizeRelationshipTypeForComparison(expectedReverse);
  const normalizedActual = normalizeRelationshipTypeForComparison(targetType);
  
  return normalizedExpected === normalizedActual;
}

/**
 * Get all possible reverse types for a given type (including gendered variants)
 * @param type - Relationship type
 * @returns Array of possible reverse types
 */
export function getPossibleReverseTypes(type: string): string[] {
  const baseReverse = getReverseRelationshipType(type);
  const reverseTypes: string[] = [baseReverse];
  
  // Add gendered variants
  const genderedVariants: Record<string, string[]> = {
    'parent': ['mother', 'father', 'mom', 'dad'],
    'child': ['son', 'daughter'],
    'sibling': ['sister', 'brother'],
    'grandparent': ['grandmother', 'grandfather'],
    'grandchild': ['grandson', 'granddaughter'],
    'spouse': ['husband', 'wife'],
    'partner': ['boyfriend', 'girlfriend']
  };
  
  if (genderedVariants[baseReverse]) {
    reverseTypes.push(...genderedVariants[baseReverse]);
  }
  
  return reverseTypes;
}
