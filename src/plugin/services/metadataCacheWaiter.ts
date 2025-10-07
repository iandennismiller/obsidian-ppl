/**
 * Metadata Cache Waiter Service
 * 
 * Utility to wait for Obsidian's metadata cache to be fully populated.
 * Useful during plugin initialization to ensure cache is ready before operations.
 */

import { App, MetadataCache } from 'obsidian';

/**
 * Wait for metadata cache to be ready
 * 
 * Checks if the metadata cache has been populated by verifying that at least
 * one file has been cached. Polls with exponential backoff.
 * 
 * @param app Obsidian App instance
 * @param maxAttempts Maximum number of polling attempts (default: 20)
 * @param initialDelay Initial delay in ms (default: 100)
 * @returns Promise that resolves when cache is ready
 */
export async function waitForMetadataCache(
  app: App,
  maxAttempts: number = 20,
  initialDelay: number = 100
): Promise<void> {
  let attempts = 0;
  let delay = initialDelay;

  while (attempts < maxAttempts) {
    // Check if cache has any files
    const files = app.vault.getMarkdownFiles();
    
    if (files.length === 0) {
      // Empty vault, cache is ready
      return;
    }

    // Check if at least one file has metadata cached
    for (const file of files) {
      const cache = app.metadataCache.getFileCache(file);
      if (cache !== null) {
        // Found a cached file, cache is ready
        return;
      }
    }

    // Cache not ready, wait and retry
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Exponential backoff
    attempts++;
    delay = Math.min(delay * 1.5, 2000); // Cap at 2 seconds
  }

  console.warn('Metadata cache not ready after max attempts, proceeding anyway');
}

/**
 * Wait for a specific file's metadata to be cached
 * 
 * @param app Obsidian App instance
 * @param filePath Path to the file
 * @param maxAttempts Maximum number of polling attempts (default: 10)
 * @param initialDelay Initial delay in ms (default: 100)
 * @returns Promise that resolves when file cache is ready, or null if not found
 */
export async function waitForFileCache(
  app: App,
  filePath: string,
  maxAttempts: number = 10,
  initialDelay: number = 100
): Promise<boolean> {
  let attempts = 0;
  let delay = initialDelay;

  while (attempts < maxAttempts) {
    const file = app.vault.getAbstractFileByPath(filePath);
    
    if (!file) {
      // File doesn't exist
      return false;
    }

    const cache = app.metadataCache.getFileCache(file);
    if (cache !== null) {
      // Cache is ready
      return true;
    }

    // Cache not ready, wait and retry
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Exponential backoff
    attempts++;
    delay = Math.min(delay * 1.5, 1000); // Cap at 1 second
  }

  return false;
}
