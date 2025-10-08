/**
 * Type definitions for ContactNote model
 */

/**
 * Represents a relationship between contacts
 */
export interface Relationship {
  /** Relationship type (e.g., "friend", "colleague", "parent") */
  type: string;
  /** UID of the related contact */
  targetUID: string;
  /** Display name of the related contact (optional, for UI) */
  targetName?: string;
  /** Namespace format for the UID reference */
  namespace: 'urn:uuid' | 'uid' | 'name';
}

/**
 * Contact section data structure
 */
export interface ContactSectionData {
  /** Email addresses */
  emails: ContactField[];
  /** Phone numbers */
  phones: ContactField[];
  /** URLs/websites */
  urls: ContactField[];
  /** Physical addresses */
  addresses: ContactField[];
}

/**
 * Represents a single contact field (email, phone, etc.)
 */
export interface ContactField {
  /** Field type/category (e.g., "work", "home", "cell") */
  type?: string;
  /** Field value */
  value: string;
}

/**
 * Represents a markdown heading
 */
export interface Heading {
  /** Heading level (1-6) */
  level: number;
  /** Heading text */
  text: string;
  /** Position in the document (character index) */
  position: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
}
