/**
 * Unit tests for ContactManager cache operations
 */

import { describe, it, expect } from 'vitest';
import {
  buildUIDIndex,
  buildPathIndex,
  updateCacheEntry,
  removeCacheEntry,
  getCacheEntryByUID,
  getCacheEntryByPath,
  getAllCacheEntries,
  clearCache,
  validateCacheConsistency
} from '../../../../src/models/contactManager/cache';
import type { ContactCacheEntry } from '../../../../src/models/contactManager/types';

describe('ContactManager Cache Operations', () => {
  const mockEntries: ContactCacheEntry[] = [
    { uid: 'uid1', path: '/contacts/alice.md', name: 'Alice', mtime: 1000 },
    { uid: 'uid2', path: '/contacts/bob.md', name: 'Bob', mtime: 2000 },
    { uid: 'uid3', path: '/contacts/charlie.md', name: 'Charlie', mtime: 3000 }
  ];

  describe('buildUIDIndex', () => {
    it('should build UID index from entries', () => {
      const index = buildUIDIndex(mockEntries);
      
      expect(index.size).toBe(3);
      expect(index.get('uid1')?.name).toBe('Alice');
      expect(index.get('uid2')?.name).toBe('Bob');
    });

    it('should skip entries without UID', () => {
      const entries: ContactCacheEntry[] = [
        { uid: '', path: '/test.md', name: 'Test', mtime: 1000 }
      ];
      
      const index = buildUIDIndex(entries);
      expect(index.size).toBe(0);
    });
  });

  describe('buildPathIndex', () => {
    it('should build path index from entries', () => {
      const index = buildPathIndex(mockEntries);
      
      expect(index.size).toBe(3);
      expect(index.get('/contacts/alice.md')).toBe('uid1');
      expect(index.get('/contacts/bob.md')).toBe('uid2');
    });
  });

  describe('updateCacheEntry', () => {
    it('should add new entry to both indices', () => {
      const uidIndex = new Map();
      const pathIndex = new Map();
      const newEntry: ContactCacheEntry = {
        uid: 'uid4',
        path: '/contacts/dave.md',
        name: 'Dave',
        mtime: 4000
      };
      
      updateCacheEntry(uidIndex, pathIndex, newEntry);
      
      expect(uidIndex.get('uid4')).toEqual(newEntry);
      expect(pathIndex.get('/contacts/dave.md')).toBe('uid4');
    });

    it('should update existing entry', () => {
      const uidIndex = buildUIDIndex(mockEntries);
      const pathIndex = buildPathIndex(mockEntries);
      const updatedEntry: ContactCacheEntry = {
        uid: 'uid1',
        path: '/contacts/alice-updated.md',
        name: 'Alice Updated',
        mtime: 5000
      };
      
      updateCacheEntry(uidIndex, pathIndex, updatedEntry);
      
      expect(uidIndex.get('uid1')?.name).toBe('Alice Updated');
      expect(pathIndex.get('/contacts/alice-updated.md')).toBe('uid1');
    });
  });

  describe('removeCacheEntry', () => {
    it('should remove entry from both indices', () => {
      const uidIndex = buildUIDIndex(mockEntries);
      const pathIndex = buildPathIndex(mockEntries);
      
      removeCacheEntry(uidIndex, pathIndex, 'uid1');
      
      expect(uidIndex.has('uid1')).toBe(false);
      expect(pathIndex.has('/contacts/alice.md')).toBe(false);
    });

    it('should handle removing non-existent entry', () => {
      const uidIndex = buildUIDIndex(mockEntries);
      const pathIndex = buildPathIndex(mockEntries);
      
      removeCacheEntry(uidIndex, pathIndex, 'nonexistent');
      
      expect(uidIndex.size).toBe(3);
    });
  });

  describe('getCacheEntryByUID', () => {
    it('should retrieve entry by UID', () => {
      const uidIndex = buildUIDIndex(mockEntries);
      
      const entry = getCacheEntryByUID(uidIndex, 'uid2');
      
      expect(entry?.name).toBe('Bob');
    });

    it('should return undefined for non-existent UID', () => {
      const uidIndex = buildUIDIndex(mockEntries);
      
      const entry = getCacheEntryByUID(uidIndex, 'nonexistent');
      
      expect(entry).toBeUndefined();
    });
  });

  describe('getCacheEntryByPath', () => {
    it('should retrieve entry by path', () => {
      const uidIndex = buildUIDIndex(mockEntries);
      const pathIndex = buildPathIndex(mockEntries);
      
      const entry = getCacheEntryByPath(uidIndex, pathIndex, '/contacts/charlie.md');
      
      expect(entry?.name).toBe('Charlie');
    });

    it('should return undefined for non-existent path', () => {
      const uidIndex = buildUIDIndex(mockEntries);
      const pathIndex = buildPathIndex(mockEntries);
      
      const entry = getCacheEntryByPath(uidIndex, pathIndex, '/nonexistent.md');
      
      expect(entry).toBeUndefined();
    });
  });

  describe('getAllCacheEntries', () => {
    it('should return all entries', () => {
      const uidIndex = buildUIDIndex(mockEntries);
      
      const entries = getAllCacheEntries(uidIndex);
      
      expect(entries).toHaveLength(3);
      expect(entries.map(e => e.name)).toContain('Alice');
      expect(entries.map(e => e.name)).toContain('Bob');
    });
  });

  describe('clearCache', () => {
    it('should clear both indices', () => {
      const uidIndex = buildUIDIndex(mockEntries);
      const pathIndex = buildPathIndex(mockEntries);
      
      clearCache(uidIndex, pathIndex);
      
      expect(uidIndex.size).toBe(0);
      expect(pathIndex.size).toBe(0);
    });
  });

  describe('validateCacheConsistency', () => {
    it('should return no errors for consistent cache', () => {
      const uidIndex = buildUIDIndex(mockEntries);
      const pathIndex = buildPathIndex(mockEntries);
      
      const errors = validateCacheConsistency(uidIndex, pathIndex);
      
      expect(errors).toHaveLength(0);
    });

    it('should detect path referencing non-existent UID', () => {
      const uidIndex = new Map();
      const pathIndex = new Map();
      pathIndex.set('/test.md', 'nonexistent-uid');
      
      const errors = validateCacheConsistency(uidIndex, pathIndex);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('nonexistent-uid');
    });
  });
});
