/**
 * Unit tests for VcardManager write queue
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WriteQueue } from '../../../../src/models/vcardManager/writeQueue';
import type { WriteOperation } from '../../../../src/models/vcardManager/types';

describe('VcardManager WriteQueue', () => {
  let queue: WriteQueue;

  beforeEach(() => {
    queue = new WriteQueue();
  });

  describe('enqueue', () => {
    it('should add operation to queue', () => {
      const operation: WriteOperation = {
        path: '/test.vcf',
        data: 'BEGIN:VCARD...',
        priority: 1,
        timestamp: Date.now()
      };
      
      queue.enqueue(operation);
      
      expect(queue.size).toBe(1);
    });

    it('should order operations by priority', () => {
      const lowPriority: WriteOperation = {
        path: '/low.vcf',
        data: 'data',
        priority: 1,
        timestamp: Date.now()
      };
      
      const highPriority: WriteOperation = {
        path: '/high.vcf',
        data: 'data',
        priority: 10,
        timestamp: Date.now()
      };
      
      queue.enqueue(lowPriority);
      queue.enqueue(highPriority);
      
      expect(queue.size).toBe(2);
      // High priority should be processed first
    });
  });

  describe('processQueue', () => {
    it('should process all operations', async () => {
      const processed: string[] = [];
      
      const writer = async (op: WriteOperation) => {
        processed.push(op.path);
      };
      
      queue.enqueue({ path: '/test1.vcf', data: 'data1', priority: 1, timestamp: Date.now() });
      queue.enqueue({ path: '/test2.vcf', data: 'data2', priority: 1, timestamp: Date.now() });
      
      await queue.processQueue(writer);
      
      expect(processed).toHaveLength(2);
      expect(processed).toContain('/test1.vcf');
      expect(processed).toContain('/test2.vcf');
    });

    it('should prevent concurrent writes to same path', async () => {
      const writeOrder: string[] = [];
      
      const writer = async (op: WriteOperation) => {
        writeOrder.push(`start:${op.path}`);
        await new Promise(resolve => setTimeout(resolve, 10));
        writeOrder.push(`end:${op.path}`);
      };
      
      // Enqueue operations for same path
      queue.enqueue({ path: '/test.vcf', data: 'data1', priority: 1, timestamp: Date.now() });
      queue.enqueue({ path: '/test.vcf', data: 'data2', priority: 1, timestamp: Date.now() });
      
      await queue.processQueue(writer);
      
      // Should complete first write before starting second
      expect(writeOrder[0]).toBe('start:/test.vcf');
      expect(writeOrder[1]).toBe('end:/test.vcf');
      expect(writeOrder[2]).toBe('start:/test.vcf');
      expect(writeOrder[3]).toBe('end:/test.vcf');
    });

    it('should continue processing even if one operation fails', async () => {
      const processed: string[] = [];
      
      const writer = async (op: WriteOperation) => {
        if (op.path === '/fail.vcf') {
          throw new Error('Write failed');
        }
        processed.push(op.path);
      };
      
      queue.enqueue({ path: '/test1.vcf', data: 'data', priority: 1, timestamp: Date.now() });
      queue.enqueue({ path: '/fail.vcf', data: 'data', priority: 1, timestamp: Date.now() });
      queue.enqueue({ path: '/test2.vcf', data: 'data', priority: 1, timestamp: Date.now() });
      
      await queue.processQueue(writer);
      
      expect(processed).toContain('/test1.vcf');
      expect(processed).toContain('/test2.vcf');
      expect(processed).not.toContain('/fail.vcf');
    });
  });

  describe('clear', () => {
    it('should clear the queue', () => {
      queue.enqueue({ path: '/test.vcf', data: 'data', priority: 1, timestamp: Date.now() });
      
      queue.clear();
      
      expect(queue.size).toBe(0);
    });
  });

  describe('getStatus', () => {
    it('should return queue status', () => {
      queue.enqueue({ path: '/test.vcf', data: 'data', priority: 1, timestamp: Date.now() });
      
      const status = queue.getStatus();
      
      expect(status.pending).toBe(1);
      expect(status.processing).toBe(false);
      expect(status.current).toBeNull();
    });
  });

  describe('isPathActive', () => {
    it('should return false for inactive path', () => {
      expect(queue.isPathActive('/test.vcf')).toBe(false);
    });
  });
});
