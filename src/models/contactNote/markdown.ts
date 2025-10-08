/**
 * Markdown operations for contact notes
 * Handles Contact section parsing and generation
 */

import { ContactSectionData, ContactField, Heading } from './types';

/**
 * Parse Contact section from markdown content
 * @param content - Markdown content
 * @returns Contact section data
 */
export function parseContactSection(content: string): ContactSectionData {
  const data: ContactSectionData = {
    emails: [],
    phones: [],
    urls: [],
    addresses: []
  };
  
  // Find the Contact heading
  const headingMatch = findContactHeading(content);
  if (!headingMatch) {
    return data;
  }
  
  // Extract content after the Contact heading until next heading
  const headingEnd = headingMatch.index + headingMatch.heading.length;
  const afterHeading = content.substring(headingEnd);
  const nextHeadingMatch = afterHeading.match(/^#{1,6}\s+/m);
  const sectionEnd = nextHeadingMatch ? nextHeadingMatch.index! : afterHeading.length;
  const sectionContent = afterHeading.substring(0, sectionEnd);
  
  // Parse list items
  const listItemRegex = /^-\s+(.+)$/gm;
  let match;
  
  while ((match = listItemRegex.exec(sectionContent)) !== null) {
    const line = match[1].trim();
    parseContactLine(line, data);
  }
  
  return data;
}

/**
 * Generate Contact section markdown from data
 * @param data - Contact section data
 * @returns Markdown string for Contact section
 */
export function generateContactSection(data: ContactSectionData): string {
  const lines: string[] = ['## Contact', ''];
  
  // Add emails
  for (const email of data.emails) {
    const label = email.type ? `${email.type} ` : '';
    lines.push(`- ${label}${email.value}`);
  }
  
  // Add phones
  for (const phone of data.phones) {
    const label = phone.type ? `${phone.type} ` : '';
    lines.push(`- ${label}${phone.value}`);
  }
  
  // Add URLs
  for (const url of data.urls) {
    const label = url.type ? `${url.type} ` : '';
    lines.push(`- ${label}${url.value}`);
  }
  
  // Add addresses
  for (const address of data.addresses) {
    const label = address.type ? `${address.type} ` : '';
    lines.push(`- ${label}${address.value}`);
  }
  
  return lines.join('\n');
}

/**
 * Extract headings from markdown content
 * @param content - Markdown content
 * @returns Array of headings
 */
export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim(),
      position: match.index
    });
  }
  
  return headings;
}

/**
 * Find section content by heading
 * @param content - Markdown content
 * @param heading - Heading text to search for
 * @returns Section content or null if not found
 */
export function findSectionByHeading(content: string, heading: string): string | null {
  const headingRegex = new RegExp(`^#{1,6}\\s+${heading}\\s*$`, 'im');
  const match = headingRegex.exec(content);
  
  if (!match) {
    return null;
  }
  
  // Extract content after heading until next heading
  const afterHeading = content.substring(match.index + match[0].length);
  const nextHeadingMatch = afterHeading.match(/^#{1,6}\s+/m);
  const sectionEnd = nextHeadingMatch ? nextHeadingMatch.index! : afterHeading.length;
  
  return afterHeading.substring(0, sectionEnd).trim();
}

/**
 * Replace section content by heading
 * @param content - Markdown content
 * @param heading - Heading text to search for
 * @param newContent - New content for the section
 * @returns Updated markdown content
 */
export function replaceSectionByHeading(content: string, heading: string, newContent: string): string {
  const headingRegex = new RegExp(`^(#{1,6}\\s+${heading}\\s*$)`, 'im');
  const match = headingRegex.exec(content);
  
  if (!match) {
    // Heading not found, append to end
    return `${content}\n\n${newContent}`;
  }
  
  // Find the extent of the current section
  const afterHeading = content.substring(match.index + match[0].length);
  const nextHeadingMatch = afterHeading.match(/^#{1,6}\s+/m);
  const sectionEnd = nextHeadingMatch ? nextHeadingMatch.index! : afterHeading.length;
  
  // Replace the section content
  const before = content.substring(0, match.index + match[0].length);
  const after = content.substring(match.index + match[0].length + sectionEnd);
  
  return `${before}\n${newContent}\n${after}`;
}

/**
 * Ensure sections appear in correct order
 * @param content - Markdown content
 * @param orderedHeadings - Array of headings in desired order
 * @returns Content with sections in correct order
 */
export function ensureSectionOrder(content: string, orderedHeadings: string[]): string {
  // Extract all sections
  const sections = new Map<string, string>();
  
  for (const heading of orderedHeadings) {
    const headingRegex = new RegExp(`^(#{1,6}\\s+${heading}\\s*$)`, 'im');
    const match = headingRegex.exec(content);
    
    if (match) {
      const afterHeading = content.substring(match.index);
      const nextHeadingMatch = afterHeading.substring(1).match(/^#{1,6}\s+/m);
      const sectionEnd = nextHeadingMatch ? nextHeadingMatch.index! + 1 : afterHeading.length;
      const sectionContent = afterHeading.substring(0, sectionEnd).trim();
      sections.set(heading, sectionContent);
    }
  }
  
  // Remove sections from content
  let newContent = content;
  for (const heading of orderedHeadings) {
    const headingRegex = new RegExp(`^#{1,6}\\s+${heading}\\s*$[\\s\\S]*?(?=^#{1,6}\\s+|$)`, 'im');
    newContent = newContent.replace(headingRegex, '');
  }
  
  // Re-add sections in correct order
  const orderedSections: string[] = [];
  for (const heading of orderedHeadings) {
    if (sections.has(heading)) {
      orderedSections.push(sections.get(heading)!);
    }
  }
  
  return `${newContent.trim()}\n\n${orderedSections.join('\n\n')}`.trim();
}

/**
 * Find the Contact heading in markdown content
 * @param content - Markdown content
 * @returns Heading info or null if not found
 */
function findContactHeading(content: string): { index: number; heading: string } | null {
  const headingRegex = /^(#{1,6})\s+(contact)\s*$/im;
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
 * Parse a contact line and add to appropriate category
 * @param line - Contact line text
 * @param data - Contact section data to update
 */
function parseContactLine(line: string, data: ContactSectionData): void {
  // Email pattern
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const emailMatch = line.match(emailRegex);
  
  if (emailMatch) {
    const type = extractTypeLabel(line, emailMatch[1]);
    data.emails.push({
      type,
      value: emailMatch[1]
    });
    return;
  }
  
  // Phone pattern
  const phoneRegex = /(\+?[\d\s\-\(\)]+)/;
  const phoneMatch = line.match(phoneRegex);
  
  if (phoneMatch && phoneMatch[1].replace(/\D/g, '').length >= 7) {
    const type = extractTypeLabel(line, phoneMatch[1]);
    data.phones.push({
      type,
      value: phoneMatch[1].trim()
    });
    return;
  }
  
  // URL pattern
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const urlMatch = line.match(urlRegex);
  
  if (urlMatch) {
    const type = extractTypeLabel(line, urlMatch[1]);
    data.urls.push({
      type,
      value: urlMatch[1]
    });
    return;
  }
  
  // Default to address if contains typical address keywords
  if (line.match(/street|avenue|road|drive|lane|boulevard|st\.|ave\.|rd\.|dr\./i)) {
    const type = extractTypeLabel(line, line);
    data.addresses.push({
      type,
      value: line
    });
  }
}

/**
 * Extract type label from contact line
 * @param line - Full line text
 * @param value - The extracted value
 * @returns Type label or undefined
 */
function extractTypeLabel(line: string, value: string): string | undefined {
  const beforeValue = line.substring(0, line.indexOf(value)).trim();
  
  if (beforeValue && beforeValue.length > 0) {
    // Remove common prefixes
    return beforeValue.replace(/^(email|phone|url|address):/i, '').trim();
  }
  
  return undefined;
}
