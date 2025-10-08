/**
 * Drop Handler Service
 * 
 * Handles VCF files dropped into the vault.
 * Imports contacts from VCF files and optionally moves them to watch folder.
 */

import { App, Notice, TFile } from 'obsidian';
import { ContactsPluginSettings } from '../settings';
import { VcardFile } from '../../models/vcardFile';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Setup VCF file drop handler
 * 
 * Watches for .vcf file creation events and handles them automatically
 * 
 * @param app Obsidian App instance
 * @param settings Plugin settings
 * @returns Cleanup function to remove the event handler
 */
export function setupVcardDropHandler(
  app: App,
  settings: ContactsPluginSettings,
  onVcfImport?: (vcardFile: VcardFile, sourcePath: string) => Promise<void>
): () => void {
  
  const handleFileCreate = async (file: TFile) => {
    // Only process VCF files
    if (file.extension !== 'vcf') {
      return;
    }

    try {
      // Read VCF file content
      const content = await app.vault.read(file);
      
      // Parse VCF file
      const vcardFile = VcardFile.fromString(content);
      const contacts = vcardFile.getAllContacts();
      
      if (contacts.length === 0) {
        new Notice('VCF file contains no valid contacts');
        return;
      }

      // Show notification
      new Notice(`Importing ${contacts.length} contact(s) from ${file.name}...`);

      // Trigger import callback if provided
      if (onVcfImport) {
        await onVcfImport(vcardFile, file.path);
      }

      // Move VCF to watch folder if enabled and folder is configured
      if (settings.vcardWatchEnabled && settings.vcardWatchFolder) {
        await moveVcfToWatchFolder(app, file, settings.vcardWatchFolder);
        new Notice(`VCF file moved to watch folder`);
      } else {
        // Delete the VCF file from vault if not moving to watch folder
        await app.vault.delete(file);
      }

      new Notice(`Successfully imported ${contacts.length} contact(s)`);
    } catch (error) {
      console.error('Error importing VCF file:', error);
      new Notice(`Error importing VCF file: ${error.message}`);
    }
  };

  // Register event handler
  const eventRef = app.vault.on('create', handleFileCreate);

  // Return cleanup function
  return () => {
    app.vault.offref(eventRef);
  };
}

/**
 * Move VCF file from vault to watch folder
 */
async function moveVcfToWatchFolder(
  app: App,
  file: TFile,
  watchFolder: string
): Promise<void> {
  try {
    // Read file content
    const content = await app.vault.read(file);
    
    // Ensure watch folder exists
    if (!fs.existsSync(watchFolder)) {
      fs.mkdirSync(watchFolder, { recursive: true });
    }

    // Determine target path
    const targetPath = path.join(watchFolder, file.name);
    
    // Check if file already exists in watch folder
    if (fs.existsSync(targetPath)) {
      // Generate unique filename
      const baseName = path.basename(file.name, '.vcf');
      const timestamp = Date.now();
      const uniqueName = `${baseName}-${timestamp}.vcf`;
      const uniquePath = path.join(watchFolder, uniqueName);
      
      // Write to unique path
      fs.writeFileSync(uniquePath, content, 'utf-8');
    } else {
      // Write to normal path
      fs.writeFileSync(targetPath, content, 'utf-8');
    }

    // Delete from vault
    await app.vault.delete(file);
  } catch (error) {
    console.error('Error moving VCF to watch folder:', error);
    throw error;
  }
}
