/**
 * VcardFile class - Represents a vCard file with parsing and generation capabilities
 */

import { VCardData } from './types';
import { parseVcfFile, parseVcfContact } from './parsing';
import { generateVcfFile, generateVcfContact } from './generation';

/**
 * Represents a vCard file containing one or more contacts
 */
export class VcardFile {
  /** Filename or path */
  public filename: string;
  
  /** Array of contacts in this file */
  public contacts: VCardData[];
  
  /** Original file content (optional, for debugging) */
  public rawContent?: string;

  /**
   * Create a new VcardFile instance
   * @param filename - Filename or path
   * @param contacts - Array of contact data (default: empty array)
   * @param rawContent - Original file content (optional)
   */
  constructor(filename: string = '', contacts: VCardData[] = [], rawContent?: string) {
    this.filename = filename;
    this.contacts = contacts;
    this.rawContent = rawContent;
  }

  /**
   * Create a VcardFile from file content
   * @param path - File path
   * @param content - File content as string
   * @returns VcardFile instance
   */
  static fromString(content: string, filename: string = 'contacts.vcf'): VcardFile {
    const contacts = parseVcfFile(content);
    return new VcardFile(filename, contacts, content);
  }

  /**
   * Create an empty VcardFile
   * @param filename - Optional filename
   * @returns Empty VcardFile instance
   */
  static empty(filename: string = 'contacts.vcf'): VcardFile {
    return new VcardFile(filename, []);
  }

  /**
   * Add a contact to the file
   * @param data - Contact data
   */
  addContact(data: VCardData): void {
    if (!data.UID) {
      throw new Error('Cannot add contact: missing UID');
    }
    if (!data.FN) {
      throw new Error('Cannot add contact: missing FN (formatted name)');
    }

    // Check if contact with this UID already exists
    const existingIndex = this.contacts.findIndex(c => c.UID === data.UID);
    
    if (existingIndex >= 0) {
      // Update existing contact
      this.contacts[existingIndex] = data;
    } else {
      // Add new contact
      this.contacts.push(data);
    }
  }

  /**
   * Remove a contact by UID
   * @param uid - Contact UID
   * @returns true if contact was removed, false if not found
   */
  removeContact(uid: string): boolean {
    const index = this.contacts.findIndex(c => c.UID === uid);
    
    if (index >= 0) {
      this.contacts.splice(index, 1);
      return true;
    }
    
    return false;
  }

  /**
   * Get a contact by UID
   * @param uid - Contact UID
   * @returns Contact data or undefined if not found
   */
  getContact(uid: string): VCardData | undefined {
    return this.contacts.find(c => c.UID === uid);
  }

  /**
   * Get all contacts
   * @returns Array of all contact data
   */
  getAllContacts(): VCardData[] {
    return [...this.contacts]; // Return a copy
  }

  /**
   * Convert the file to VCF string format
   * @returns VCF file content as string
   */
  toVCardString(): string {
    return generateVcfFile(this.contacts);
  }

  /**
   * Get the number of contacts in the file
   * @returns Number of contacts
   */
  get count(): number {
    return this.contacts.length;
  }

  /**
   * Check if the file is empty
   * @returns true if no contacts, false otherwise
   */
  isEmpty(): boolean {
    return this.contacts.length === 0;
  }

  /**
   * Clear all contacts from the file
   */
  clear(): void {
    this.contacts = [];
    this.rawContent = undefined;
  }

  /**
   * Parse and add a vCard string to the file
   * @param vcardString - vCard string
   * @returns true if successfully added, false otherwise
   */
  addFromString(vcardString: string): boolean {
    try {
      const contact = parseVcfContact(vcardString);
      if (contact) {
        this.addContact(contact);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding contact from string:', error);
      return false;
    }
  }

  /**
   * Get contact UIDs
   * @returns Array of all contact UIDs
   */
  getUIDs(): string[] {
    return this.contacts.map(c => c.UID);
  }

  /**
   * Check if a contact with the given UID exists
   * @param uid - Contact UID
   * @returns true if contact exists, false otherwise
   */
  hasContact(uid: string): boolean {
    return this.contacts.some(c => c.UID === uid);
  }
}
