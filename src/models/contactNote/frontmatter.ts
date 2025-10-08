/**
 * Frontmatter operations for contact notes
 * Handles YAML frontmatter parsing and generation
 */

import YAML from 'yaml';
import { ValidationResult } from './types';

/**
 * Parse frontmatter from markdown content
 * @param content - Full markdown content including frontmatter
 * @returns Object with frontmatter and body
 */
export function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const emptyFrontmatterRegex = /^---\s*\n---\s*\n([\s\S]*)$/;
  
  // Check for empty frontmatter first
  let match = content.match(emptyFrontmatterRegex);
  if (match) {
    return {
      frontmatter: {},
      body: match[1]
    };
  }
  
  // Check for regular frontmatter
  match = content.match(frontmatterRegex);
  if (!match) {
    return {
      frontmatter: {},
      body: content
    };
  }
  
  try {
    const frontmatterText = match[1].trim();
    const frontmatter = YAML.parse(frontmatterText) || {};
    const body = match[2];
    return { frontmatter, body };
  } catch (error) {
    console.error('Error parsing frontmatter:', error);
    return {
      frontmatter: {},
      body: content
    };
  }
}

/**
 * Generate YAML frontmatter string from data
 * @param data - Frontmatter data object
 * @returns YAML string
 */
export function generateFrontmatter(data: Record<string, any>): string {
  if (!data || Object.keys(data).length === 0) {
    return '';
  }
  
  try {
    return YAML.stringify(data, {
      defaultStringType: 'QUOTE_DOUBLE',
      defaultKeyType: 'PLAIN'
    });
  } catch (error) {
    console.error('Error generating frontmatter:', error);
    return '';
  }
}

/**
 * Update frontmatter in markdown content
 * @param fileContent - Original file content
 * @param updates - Frontmatter updates to apply
 * @returns Updated file content
 */
export function updateFrontmatter(fileContent: string, updates: Record<string, any>): string {
  const { frontmatter, body } = parseFrontmatter(fileContent);
  
  // Merge updates into existing frontmatter
  const updatedFrontmatter = { ...frontmatter, ...updates };
  
  // Generate new frontmatter
  const frontmatterYaml = generateFrontmatter(updatedFrontmatter);
  
  if (!frontmatterYaml) {
    return body;
  }
  
  return `---\n${frontmatterYaml}---\n${body}`;
}

/**
 * Validate frontmatter structure
 * @param data - Frontmatter data to validate
 * @returns Validation result
 */
export function validateFrontmatter(data: Record<string, any>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for required fields
  if (!data.UID) {
    errors.push('Missing required field: UID');
  }
  
  if (!data.FN) {
    errors.push('Missing required field: FN (formatted name)');
  }
  
  // Check UID format
  if (data.UID && typeof data.UID !== 'string') {
    errors.push('UID must be a string');
  }
  
  // Check for invalid field types
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      warnings.push(`Field ${key} is undefined`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Remove invalid fields from frontmatter
 * @param data - Frontmatter data
 * @returns Cleaned frontmatter data
 */
export function removeInvalidFields(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip undefined, null, and empty string values
    if (value === undefined || value === null || value === '') {
      continue;
    }
    
    // Skip private/internal fields
    if (key.startsWith('_')) {
      continue;
    }
    
    cleaned[key] = value;
  }
  
  return cleaned;
}
