/**
 * VCF file parsing functions
 * Converts vCard 4.0 format to JavaScript objects using the vcard4 library
 */

import { parse } from 'vcard4';
import { flatten } from 'flat';
import { VCardData } from './types';

/**
 * Parse a VCF file containing one or more contacts
 * @param content - VCF file content as string
 * @returns Array of parsed contact data
 */
export function parseVcfFile(content: string): VCardData[] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  try {
    const parsed = parse(content);
    
    // parse() returns either a single contact or an array of contacts
    const contacts = Array.isArray(parsed) ? parsed : [parsed];
    
    return contacts.map(contact => vcardToFrontmatter(contact));
  } catch (error) {
    console.error('Error parsing VCF file:', error);
    return [];
  }
}

/**
 * Parse a single vCard string
 * @param vcardString - Single vCard as string
 * @returns Parsed contact data or null if invalid
 */
export function parseVcfContact(vcardString: string): VCardData | null {
  if (!vcardString || !vcardString.includes('BEGIN:VCARD')) {
    return null;
  }

  try {
    const parsed = parse(vcardString);
    // parse() always returns an object for a single vCard
    const contact = Array.isArray(parsed) ? parsed[0] : parsed;
    return vcardToFrontmatter(contact);
  } catch (error) {
    console.error('Error parsing vCard:', error);
    return null;
  }
}

/**
 * Convert a parsed vCard object to flat frontmatter format
 * @param vcard - Parsed vCard object from vcard4 library
 * @returns Flat frontmatter data
 */
export function vcardToFrontmatter(vcard: any): VCardData {
  const data: Record<string, any> = {};

  // Get the parsed vCard array
  const properties = vcard.parsedVcard || [];
  
  if (properties.length === 0) {
    throw new Error('Invalid vCard: no properties found');
  }

  // Process each property
  for (const prop of properties) {
    const propName = prop.property.toUpperCase();
    const propValue = prop.value;
    const parameters = prop.parameters || {};
    
    // Build the key with type parameter if present
    let key = propName;
    if (parameters.TYPE) {
      const type = Array.isArray(parameters.TYPE) ? parameters.TYPE[0] : parameters.TYPE;
      key = `${propName}.${type.toUpperCase()}`;
    }
    
    // Handle different value types
    if (typeof propValue === 'object' && !Array.isArray(propValue)) {
      // Structured value (N, ADR, GENDER, etc.)
      for (const [subKey, subValue] of Object.entries(propValue)) {
        if (subValue && subValue !== '') {
          data[`${key}.${subKey.toUpperCase()}`] = subValue;
        }
      }
    } else if (Array.isArray(propValue)) {
      // Array value
      propValue.forEach((val, idx) => {
        if (val && val !== '') {
          data[`${key}.${idx}`] = val;
        }
      });
    } else if (propValue && propValue !== '') {
      // Simple value
      // Check if this key already exists (for repeating properties like EMAIL, TEL)
      if (data[key] !== undefined) {
        // Find next available index
        let index = 0;
        while (data[`${propName}.${index}`] !== undefined) {
          index++;
        }
        data[`${propName}.${index}`] = propValue;
      } else {
        data[key] = propValue;
      }
    }
  }

  // Ensure required fields
  if (!data.UID) {
    throw new Error('Invalid vCard: missing UID field');
  }
  if (!data.FN) {
    throw new Error('Invalid vCard: missing FN (formatted name) field');
  }

  return data as VCardData;
}

/**
 * Flatten nested vCard data using the flat library
 * @param nested - Nested object
 * @returns Flattened object with dot notation keys
 */
export function flattenVCardData(nested: object): VCardData {
  const flattened = flatten(nested, {
    safe: true, // Don't flatten arrays
    delimiter: '.'
  }) as Record<string, any>;

  // Ensure required fields are present
  if (!flattened.UID) {
    throw new Error('Missing required UID field after flattening');
  }
  if (!flattened.FN) {
    throw new Error('Missing required FN field after flattening');
  }

  return flattened as VCardData;
}
