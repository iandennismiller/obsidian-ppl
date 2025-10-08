/**
 * VcardFile module - VCF file parsing and generation
 * Provides vCard 4.0 parsing and generation using the vcard4 library
 */

export { VcardFile } from './vcardFile';
export { parseVcfFile, parseVcfContact, vcardToFrontmatter, flattenVCardData } from './parsing';
export { generateVcfFile, generateVcfContact, frontmatterToVcard, unflattenFrontmatter } from './generation';
export type { VCardData, VCardField, VCardFieldType, FieldMapping } from './types';
