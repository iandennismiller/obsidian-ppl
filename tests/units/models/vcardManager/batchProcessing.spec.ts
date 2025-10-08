/**
 * Unit tests for VcardManager batch processing
 */

import { describe, it, expect } from 'vitest';
import {
  createBatchProgress,
  updateBatchProgress,
  markBatchItemCompleted,
  markBatchItemFailed,
  getBatchProgressPercentage,
  isBatchComplete,
  getBatchSummary
} from '../../../../src/models/vcardManager/batchProcessing';

describe('VcardManager Batch Processing', () => {
  describe('createBatchProgress', () => {
    it('should create batch progress with initial values', () => {
      const progress = createBatchProgress(10);
      
      expect(progress.total).toBe(10);
      expect(progress.completed).toBe(0);
      expect(progress.failed).toBe(0);
      expect(progress.current).toBeNull();
      expect(progress.done).toBe(false);
    });
  });

  describe('updateBatchProgress', () => {
    it('should update current item', () => {
      const progress = createBatchProgress(10);
      
      updateBatchProgress(progress, 'item1');
      
      expect(progress.current).toBe('item1');
    });
  });

  describe('markBatchItemCompleted', () => {
    it('should increment completed counter', () => {
      const progress = createBatchProgress(10);
      
      markBatchItemCompleted(progress);
      
      expect(progress.completed).toBe(1);
      expect(progress.current).toBeNull();
    });

    it('should mark as done when all items complete', () => {
      const progress = createBatchProgress(2);
      
      markBatchItemCompleted(progress);
      markBatchItemCompleted(progress);
      
      expect(progress.done).toBe(true);
    });
  });

  describe('markBatchItemFailed', () => {
    it('should increment failed counter', () => {
      const progress = createBatchProgress(10);
      
      markBatchItemFailed(progress);
      
      expect(progress.failed).toBe(1);
      expect(progress.current).toBeNull();
    });

    it('should mark as done when all items processed (with failures)', () => {
      const progress = createBatchProgress(2);
      
      markBatchItemCompleted(progress);
      markBatchItemFailed(progress);
      
      expect(progress.done).toBe(true);
    });
  });

  describe('getBatchProgressPercentage', () => {
    it('should calculate percentage correctly', () => {
      const progress = createBatchProgress(10);
      
      markBatchItemCompleted(progress);
      markBatchItemCompleted(progress);
      markBatchItemCompleted(progress);
      
      expect(getBatchProgressPercentage(progress)).toBe(30);
    });

    it('should return 100 for zero total', () => {
      const progress = createBatchProgress(0);
      
      expect(getBatchProgressPercentage(progress)).toBe(100);
    });

    it('should include failed items in percentage', () => {
      const progress = createBatchProgress(10);
      
      markBatchItemCompleted(progress);
      markBatchItemFailed(progress);
      
      expect(getBatchProgressPercentage(progress)).toBe(20);
    });
  });

  describe('isBatchComplete', () => {
    it('should return false for incomplete batch', () => {
      const progress = createBatchProgress(10);
      
      markBatchItemCompleted(progress);
      
      expect(isBatchComplete(progress)).toBe(false);
    });

    it('should return true for complete batch', () => {
      const progress = createBatchProgress(2);
      
      markBatchItemCompleted(progress);
      markBatchItemCompleted(progress);
      
      expect(isBatchComplete(progress)).toBe(true);
    });
  });

  describe('getBatchSummary', () => {
    it('should return formatted summary', () => {
      const progress = createBatchProgress(10);
      
      markBatchItemCompleted(progress);
      markBatchItemCompleted(progress);
      markBatchItemFailed(progress);
      
      const summary = getBatchSummary(progress);
      
      expect(summary).toContain('2/10');
      expect(summary).toContain('30%');
      expect(summary).toContain('1 failed');
    });
  });
});
