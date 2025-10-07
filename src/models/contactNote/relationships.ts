/**
 * Relationship operations for contact notes
 * Handles parsing and generation of the Related section and RELATED frontmatter fields
 */

import { Relationship } from './types';

/**
 * Parse relationships from the Related markdown section
 * @param content - Markdown content
 * @returns Array of relationships
 */
export function parseRelatedSection(content: string): Relationship[] {
  const relationships: Relationship[] = [];
  
  // Find the Related heading
  const headingMatch = findRelatedHeading(content);
  if (!headingMatch) {
    return relationships;
  }
  
  // Extract content after the Related heading until next heading
  const headingEnd = headingMatch.index + headingMatch.heading.length;
  const afterHeading = content.substring(headingEnd);
  const nextHeadingMatch = afterHeading.match(/^#{1,6}\s+/m);
  const sectionEnd = nextHeadingMatch ? nextHeadingMatch.index! : afterHeading.length;
  const sectionContent = afterHeading.substring(0, sectionEnd);
  
  // Parse list items
  const listItemRegex = /^-\s+(\w+)\s+\[\[([^\]]+)\]\]/gm;
  let match;
  
  while ((match = listItemRegex.exec(sectionContent)) !== null) {
    const type = match[1].toLowerCase();
    const targetName = match[2];
    
    relationships.push({
      type,
      targetUID: '', // Will be resolved later from targetName
      targetName,
      namespace: 'name' // Default to name namespace until UID is resolved
    });
  }
  
  return relationships;
}

/**
 * Generate Related section markdown from relationships
 * @param relationships - Array of relationships
 * @returns Markdown string for Related section
 */
export function generateRelatedSection(relationships: Relationship[]): string {
  if (relationships.length === 0) {
    return '';
  }
  
  const lines: string[] = ['## Related', ''];
  
  for (const rel of relationships) {
    const displayName = rel.targetName || rel.targetUID;
    lines.push(`- ${rel.type} [[${displayName}]]`);
  }
  
  return lines.join('\n');
}

/**
 * Parse relationships from RELATED frontmatter fields
 * @param frontmatter - Frontmatter data
 * @returns Array of relationships
 */
export function parseRelatedFrontmatter(frontmatter: Record<string, any>): Relationship[] {
  const relationships: Relationship[] = [];
  
  for (const [key, value] of Object.entries(frontmatter)) {
    // Match RELATED.type or RELATED.type.index patterns
    const match = key.match(/^RELATED\.([^.]+)(?:\.(\d+))?$/);
    if (!match) {
      continue;
    }
    
    const type = match[1].toLowerCase();
    
    if (typeof value === 'string') {
      const { namespace, uid } = parseUIDReference(value);
      relationships.push({
        type,
        targetUID: uid,
        namespace
      });
    }
  }
  
  return relationships;
}

/**
 * Generate RELATED frontmatter fields from relationships
 * @param relationships - Array of relationships
 * @returns Frontmatter fields object
 */
export function generateRelatedFrontmatter(relationships: Relationship[]): Record<string, any> {
  const frontmatter: Record<string, any> = {};
  
  // Group relationships by type
  const byType = new Map<string, Relationship[]>();
  
  for (const rel of relationships) {
    const type = rel.type.toUpperCase();
    if (!byType.has(type)) {
      byType.set(type, []);
    }
    byType.get(type)!.push(rel);
  }
  
  // Generate frontmatter fields
  for (const [type, rels] of byType) {
    if (rels.length === 1) {
      // Single relationship of this type
      frontmatter[`RELATED.${type}`] = formatUIDReference(rels[0]);
    } else {
      // Multiple relationships of this type
      rels.forEach((rel, index) => {
        frontmatter[`RELATED.${type}.${index}`] = formatUIDReference(rel);
      });
    }
  }
  
  return frontmatter;
}

/**
 * Normalize relationship type to genderless form
 * @param type - Relationship type (potentially gendered)
 * @returns Normalized genderless type
 */
export function normalizeRelationshipType(type: string): string {
  const normalizations: Record<string, string> = {
    'mother': 'parent',
    'mom': 'parent',
    'father': 'parent',
    'dad': 'parent',
    'sister': 'sibling',
    'brother': 'sibling',
    'son': 'child',
    'daughter': 'child',
    'husband': 'spouse',
    'wife': 'spouse',
    'boyfriend': 'partner',
    'girlfriend': 'partner'
  };
  
  return normalizations[type.toLowerCase()] || type.toLowerCase();
}

/**
 * Get gendered relationship type based on gender
 * @param type - Genderless relationship type
 * @param gender - Gender (M, F, O, N, U)
 * @returns Gendered relationship type
 */
export function getGenderedRelationshipType(type: string, gender: string): string {
  const genderMap: Record<string, Record<string, string>> = {
    'parent': {
      'M': 'father',
      'F': 'mother'
    },
    'sibling': {
      'M': 'brother',
      'F': 'sister'
    },
    'child': {
      'M': 'son',
      'F': 'daughter'
    },
    'spouse': {
      'M': 'husband',
      'F': 'wife'
    },
    'partner': {
      'M': 'boyfriend',
      'F': 'girlfriend'
    }
  };
  
  const normalizedType = type.toLowerCase();
  const genderUpper = gender.toUpperCase();
  
  if (genderMap[normalizedType] && genderMap[normalizedType][genderUpper]) {
    return genderMap[normalizedType][genderUpper];
  }
  
  return type;
}

/**
 * Infer gender from relationship type
 * @param type - Relationship type
 * @returns Inferred gender (M, F) or undefined
 */
export function inferGenderFromType(type: string): string | undefined {
  const genderInference: Record<string, string> = {
    'mother': 'F',
    'mom': 'F',
    'father': 'M',
    'dad': 'M',
    'sister': 'F',
    'brother': 'M',
    'son': 'M',
    'daughter': 'F',
    'husband': 'M',
    'wife': 'F',
    'boyfriend': 'M',
    'girlfriend': 'F'
  };
  
  return genderInference[type.toLowerCase()];
}

/**
 * Find the Related heading in markdown content
 * @param content - Markdown content
 * @returns Heading info or null if not found
 */
export function findRelatedHeading(content: string): { index: number; heading: string } | null {
  // Match ## Related (case-insensitive, any heading level)
  const headingRegex = /^(#{1,6})\s+(related)\s*$/im;
  const match = headingRegex.exec(content);
  
  if (!match) {
    return null;
  }
  
  return {
    index: match.index,
    heading: match[0]
  };
}

/**
 * Parse UID reference to extract namespace and UID
 * @param reference - UID reference string (e.g., "urn:uuid:xxx", "uid:xxx", "name:xxx")
 * @returns Parsed namespace and UID
 */
function parseUIDReference(reference: string): { namespace: 'urn:uuid' | 'uid' | 'name'; uid: string } {
  if (reference.startsWith('urn:uuid:')) {
    return {
      namespace: 'urn:uuid',
      uid: reference.substring(9)
    };
  } else if (reference.startsWith('uid:')) {
    return {
      namespace: 'uid',
      uid: reference.substring(4)
    };
  } else if (reference.startsWith('name:')) {
    return {
      namespace: 'name',
      uid: reference.substring(5)
    };
  } else {
    // Assume it's a raw UID
    return {
      namespace: 'uid',
      uid: reference
    };
  }
}

/**
 * Format UID reference with appropriate namespace
 * @param relationship - Relationship object
 * @returns Formatted UID reference
 */
function formatUIDReference(relationship: Relationship): string {
  if (relationship.namespace === 'urn:uuid') {
    return `urn:uuid:${relationship.targetUID}`;
  } else if (relationship.namespace === 'name') {
    return `name:${relationship.targetName || relationship.targetUID}`;
  } else {
    return `uid:${relationship.targetUID}`;
  }
}
