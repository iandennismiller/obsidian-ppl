/**
 * Cache management utilities for ContactManager
 */

import { ContactCacheEntry } from './types';

/**
 * Build a UID-based index from contact cache entries
 * @param entries - Array of contact cache entries
 * @returns Map of UID to cache entry
 */
export function buildUIDIndex(entries: ContactCacheEntry[]): Map<string, ContactCacheEntry> {
  const index = new Map<string, ContactCacheEntry>();
  
  for (const entry of entries) {
    if (entry.uid) {
      index.set(entry.uid, entry);
    }
  }
  
  return index;
}

/**
 * Build a path-based index from contact cache entries
 * @param entries - Array of contact cache entries
 * @returns Map of file path to UID
 */
export function buildPathIndex(entries: ContactCacheEntry[]): Map<string, string> {
  const index = new Map<string, string>();
  
  for (const entry of entries) {
    if (entry.path && entry.uid) {
      index.set(entry.path, entry.uid);
    }
  }
  
  return index;
}

/**
 * Update cache entry in the index
 * @param uidIndex - UID index to update
 * @param pathIndex - Path index to update
 * @param entry - Cache entry to add/update
 */
export function updateCacheEntry(
  uidIndex: Map<string, ContactCacheEntry>,
  pathIndex: Map<string, string>,
  entry: ContactCacheEntry
): void {
  if (!entry.uid) {
    return;
  }
  
  // Update UID index
  uidIndex.set(entry.uid, entry);
  
  // Update path index
  if (entry.path) {
    pathIndex.set(entry.path, entry.uid);
  }
}

/**
 * Remove cache entry from indices
 * @param uidIndex - UID index
 * @param pathIndex - Path index
 * @param uid - UID to remove
 */
export function removeCacheEntry(
  uidIndex: Map<string, ContactCacheEntry>,
  pathIndex: Map<string, string>,
  uid: string
): void {
  const entry = uidIndex.get(uid);
  
  if (entry) {
    // Remove from path index
    if (entry.path) {
      pathIndex.delete(entry.path);
    }
    
    // Remove from UID index
    uidIndex.delete(uid);
  }
}

/**
 * Get cache entry by UID
 * @param uidIndex - UID index
 * @param uid - UID to lookup
 * @returns Cache entry or undefined
 */
export function getCacheEntryByUID(
  uidIndex: Map<string, ContactCacheEntry>,
  uid: string
): ContactCacheEntry | undefined {
  return uidIndex.get(uid);
}

/**
 * Get cache entry by path
 * @param uidIndex - UID index
 * @param pathIndex - Path index
 * @param path - File path to lookup
 * @returns Cache entry or undefined
 */
export function getCacheEntryByPath(
  uidIndex: Map<string, ContactCacheEntry>,
  pathIndex: Map<string, string>,
  path: string
): ContactCacheEntry | undefined {
  const uid = pathIndex.get(path);
  if (!uid) {
    return undefined;
  }
  
  return uidIndex.get(uid);
}

/**
 * Get all cache entries
 * @param uidIndex - UID index
 * @returns Array of all cache entries
 */
export function getAllCacheEntries(uidIndex: Map<string, ContactCacheEntry>): ContactCacheEntry[] {
  return Array.from(uidIndex.values());
}

/**
 * Clear all cache indices
 * @param uidIndex - UID index to clear
 * @param pathIndex - Path index to clear
 */
export function clearCache(
  uidIndex: Map<string, ContactCacheEntry>,
  pathIndex: Map<string, string>
): void {
  uidIndex.clear();
  pathIndex.clear();
}

/**
 * Validate cache consistency
 * @param uidIndex - UID index
 * @param pathIndex - Path index
 * @returns Validation errors
 */
export function validateCacheConsistency(
  uidIndex: Map<string, ContactCacheEntry>,
  pathIndex: Map<string, string>
): string[] {
  const errors: string[] = [];
  
  // Check that every path in pathIndex has a corresponding UID in uidIndex
  for (const [path, uid] of pathIndex) {
    if (!uidIndex.has(uid)) {
      errors.push(`Path ${path} references UID ${uid} which is not in UID index`);
    }
  }
  
  // Check that every entry in uidIndex has its path in pathIndex
  for (const [uid, entry] of uidIndex) {
    if (entry.path && pathIndex.get(entry.path) !== uid) {
      errors.push(`UID ${uid} has path ${entry.path} which is not correctly indexed`);
    }
  }
  
  return errors;
}
