/**
 * Type definitions for VcardFile model
 */

/**
 * Represents vCard data in a flat format compatible with Obsidian frontmatter
 */
export interface VCardData {
  /** Unique identifier (required) */
  UID: string;
  /** Formatted name (required) */
  FN: string;
  /** vCard version (typically "4.0") */
  VERSION?: string;
  /** Revision timestamp */
  REV?: string;
  /** All other vCard fields with dot notation for nested properties */
  [key: string]: any;
}

/**
 * Represents a single vCard field with parameters
 */
export interface VCardField {
  /** Field name (e.g., "EMAIL", "TEL") */
  name: string;
  /** Field value */
  value: any;
  /** Optional parameters (e.g., TYPE, PREF) */
  parameters?: Record<string, string>;
}

/**
 * Mapping of vCard field names to their expected types
 */
export type VCardFieldType = 'text' | 'date' | 'structured' | 'uri' | 'binary';

/**
 * Field mapping configuration for conversion between vCard and frontmatter
 */
export interface FieldMapping {
  /** vCard property name */
  vcardField: string;
  /** Frontmatter key (may use dot notation) */
  frontmatterKey: string;
  /** Expected field type */
  type: VCardFieldType;
}
