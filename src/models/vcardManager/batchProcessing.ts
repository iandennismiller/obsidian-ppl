/**
 * Batch processing utilities for VcardManager
 */

import { BatchProgress } from './types';

/**
 * Create a new batch progress tracker
 * @param total - Total number of items
 * @returns Batch progress object
 */
export function createBatchProgress(total: number): BatchProgress {
  return {
    total,
    completed: 0,
    failed: 0,
    current: null,
    done: false
  };
}

/**
 * Update batch progress
 * @param progress - Progress object to update
 * @param current - Current item being processed
 */
export function updateBatchProgress(progress: BatchProgress, current: string): void {
  progress.current = current;
}

/**
 * Mark item as completed in batch progress
 * @param progress - Progress object to update
 */
export function markBatchItemCompleted(progress: BatchProgress): void {
  progress.completed++;
  progress.current = null;
  
  if (progress.completed + progress.failed >= progress.total) {
    progress.done = true;
  }
}

/**
 * Mark item as failed in batch progress
 * @param progress - Progress object to update
 */
export function markBatchItemFailed(progress: BatchProgress): void {
  progress.failed++;
  progress.current = null;
  
  if (progress.completed + progress.failed >= progress.total) {
    progress.done = true;
  }
}

/**
 * Get batch progress percentage
 * @param progress - Progress object
 * @returns Percentage complete (0-100)
 */
export function getBatchProgressPercentage(progress: BatchProgress): number {
  if (progress.total === 0) {
    return 100;
  }
  
  return Math.round(((progress.completed + progress.failed) / progress.total) * 100);
}

/**
 * Check if batch is complete
 * @param progress - Progress object
 * @returns True if batch is complete
 */
export function isBatchComplete(progress: BatchProgress): boolean {
  return progress.done;
}

/**
 * Get batch summary
 * @param progress - Progress object
 * @returns Summary string
 */
export function getBatchSummary(progress: BatchProgress): string {
  const percentage = getBatchProgressPercentage(progress);
  return `${progress.completed}/${progress.total} completed (${percentage}%), ${progress.failed} failed`;
}
