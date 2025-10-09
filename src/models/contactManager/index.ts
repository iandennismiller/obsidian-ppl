/**
 * ContactManager module exports
 */

export { ContactManager } from './contactManager';
export type { 
  ContactCacheEntry, 
  RelationshipValidationResult, 
  RelationshipError, 
  RelationshipWarning,
  ReverseRelationshipMap 
} from './types';
export * from './cache';
export * from './relationships';
