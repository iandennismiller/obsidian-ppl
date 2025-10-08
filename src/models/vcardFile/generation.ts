/**
 * VCF file generation functions
 * Converts JavaScript objects to vCard 4.0 format
 */

import { unflatten } from 'flat';
import { VCardData } from './types';

/**
 * Generate a VCF file containing multiple contacts
 * @param contacts - Array of contact data
 * @returns VCF file content as string
 */
export function generateVcfFile(contacts: VCardData[]): string {
  if (!contacts || contacts.length === 0) {
    return '';
  }

  const vcards: string[] = [];
  
  for (const contact of contacts) {
    try {
      const vcardString = generateVcfContact(contact);
      if (vcardString) {
        vcards.push(vcardString);
      }
    } catch (error) {
      console.error('Error generating vCard for contact:', contact.UID, error);
      // Continue generating other contacts even if one fails
    }
  }
  
  return vcards.join('\n');
}

/**
 * Generate a single vCard string
 * @param data - Contact data
 * @returns vCard as string
 */
export function generateVcfContact(data: VCardData): string {
  if (!data.UID) {
    throw new Error('Cannot generate vCard: missing UID');
  }
  if (!data.FN) {
    throw new Error('Cannot generate vCard: missing FN (formatted name)');
  }

  try {
    return frontmatterToVcard(data);
  } catch (error) {
    console.error('Error generating vCard:', error);
    throw error;
  }
}

/**
 * Convert flat frontmatter format to vCard string
 * @param frontmatter - Flat frontmatter data
 * @returns vCard string
 */
export function frontmatterToVcard(frontmatter: Record<string, any>): string {
  const lines: string[] = [];
  
  // Start vCard
  lines.push('BEGIN:VCARD');
  lines.push('VERSION:4.0');
  
  // Process required fields first
  if (frontmatter.UID) {
    lines.push(`UID:${frontmatter.UID}`);
  }
  if (frontmatter.FN) {
    lines.push(`FN:${frontmatter.FN}`);
  }
  
  // Group fields by base property name
  const processedKeys = new Set(['UID', 'FN', 'VERSION']);
  const fieldGroups = new Map<string, any[]>();
  
  for (const [key, value] of Object.entries(frontmatter)) {
    if (processedKeys.has(key) || value === undefined || value === null || value === '') {
      continue;
    }
    
    // Parse the key to extract base property and sub-parts
    const parts = key.split('.');
    const baseProp = parts[0];
    
    if (!fieldGroups.has(baseProp)) {
      fieldGroups.set(baseProp, []);
    }
    
    fieldGroups.get(baseProp)!.push({ key, value, parts });
  }
  
  // Generate lines for each field group
  for (const [baseProp, fields] of fieldGroups) {
    if (baseProp === 'N') {
      // Handle structured name field
      const nParts = ['', '', '', '', '']; // Family, Given, Middle, Prefix, Suffix
      for (const field of fields) {
        if (field.parts.length >= 2) {
          const subKey = field.parts[1].toUpperCase();
          if (subKey === 'FN' || subKey === 'FAMILYNAMES') nParts[0] = field.value;
          else if (subKey === 'GN' || subKey === 'GIVENNAMES') nParts[1] = field.value;
          else if (subKey === 'MN' || subKey === 'ADDITIONALNAMES') nParts[2] = field.value;
          else if (subKey === 'PREFIX' || subKey === 'HONORIFICPREFIXES') nParts[3] = field.value;
          else if (subKey === 'SUFFIX' || subKey === 'HONORIFICSUFFIXES') nParts[4] = field.value;
        }
      }
      lines.push(`N:${nParts.join(';')}`);
    } else if (baseProp === 'ADR') {
      // Handle address fields grouped by type
      const addressGroups = new Map<string, any>();
      for (const field of fields) {
        const type = field.parts[1] || 'HOME';
        if (!addressGroups.has(type)) {
          addressGroups.set(type, {});
        }
        if (field.parts.length >= 3) {
          const subKey = field.parts[2].toUpperCase();
          addressGroups.get(type)![subKey] = field.value;
        }
      }
      
      for (const [type, adrParts] of addressGroups) {
        const parts = [
          '', // PO Box
          '', // Extended address
          adrParts.STREET || adrParts.STREETADDRESS || '',
          adrParts.CITY || adrParts.LOCALITY || '',
          adrParts.REGION || '',
          adrParts.POSTAL || adrParts.POSTALCODE || '',
          adrParts.COUNTRY || adrParts.COUNTRYNAME || ''
        ];
        lines.push(`ADR;TYPE=${type.toLowerCase()}:${parts.join(';')}`);
      }
    } else if (baseProp === 'EMAIL' || baseProp === 'TEL' || baseProp === 'URL') {
      // Handle typed fields
      for (const field of fields) {
        if (field.parts.length === 1) {
          // Simple email/tel without type
          lines.push(`${baseProp}:${field.value}`);
        } else if (field.parts.length >= 2) {
          // Email/tel with type
          const type = field.parts[1];
          if (!isNaN(Number(type))) {
            // It's an index, not a type
            lines.push(`${baseProp}:${field.value}`);
          } else {
            lines.push(`${baseProp};TYPE=${type.toLowerCase()}:${field.value}`);
          }
        }
      }
    } else if (baseProp === 'RELATED') {
      // Handle relationships
      for (const field of fields) {
        if (field.parts.length >= 2) {
          const relType = field.parts[1];
          if (!isNaN(Number(relType))) {
            // It's an index within a type
            if (field.parts.length >= 3) {
              const actualType = field.parts[2];
              lines.push(`RELATED;TYPE=${actualType.toLowerCase()}:${field.value}`);
            }
          } else {
            lines.push(`RELATED;TYPE=${relType.toLowerCase()}:${field.value}`);
          }
        }
      }
    } else {
      // Handle simple fields
      for (const field of fields) {
        if (field.parts.length === 1) {
          lines.push(`${baseProp}:${field.value}`);
        }
      }
    }
  }
  
  // End vCard
  lines.push('END:VCARD');
  
  return lines.join('\r\n');
}

/**
 * Unflatten frontmatter data using the flat library
 * @param flat - Flattened object with dot notation keys
 * @returns Nested object structure
 */
export function unflattenFrontmatter(flat: Record<string, any>): object {
  return unflatten(flat, {
    delimiter: '.',
    object: true
  });
}
