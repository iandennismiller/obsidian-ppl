/**
 * Type definitions for ContactManager model
 */

/**
 * Contact cache entry
 */
export interface ContactCacheEntry {
  /** Contact UID */
  uid: string;
  /** File path in vault */
  path: string;
  /** Display name */
  name: string;
  /** Last modified time */
  mtime: number;
}

/**
 * Validation result for relationship graph
 */
export interface RelationshipValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: RelationshipError[];
  /** Validation warnings */
  warnings: RelationshipWarning[];
}

/**
 * Relationship error
 */
export interface RelationshipError {
  /** Source contact UID */
  sourceUID: string;
  /** Target contact UID */
  targetUID: string;
  /** Relationship type */
  type: string;
  /** Error message */
  message: string;
}

/**
 * Relationship warning
 */
export interface RelationshipWarning {
  /** Source contact UID */
  sourceUID: string;
  /** Target contact UID (optional) */
  targetUID?: string;
  /** Warning message */
  message: string;
}

/**
 * Reverse relationship mapping
 */
export interface ReverseRelationshipMap {
  [key: string]: string;
}
