/**
 * Write queue system for controlled file operations
 * Prevents concurrent writes to the same file
 */

import { WriteOperation, WriteQueueStatus } from './types';

/**
 * Write queue class
 * Manages sequential write operations to prevent conflicts
 */
export class WriteQueue {
  private queue: WriteOperation[] = [];
  private processing = false;
  private currentOperation: WriteOperation | null = null;
  private activePaths = new Set<string>();

  /**
   * Enqueue a write operation
   * @param operation - Write operation to enqueue
   */
  enqueue(operation: WriteOperation): void {
    // Insert operation in priority order (higher priority first)
    const insertIndex = this.queue.findIndex(op => op.priority < operation.priority);
    
    if (insertIndex === -1) {
      this.queue.push(operation);
    } else {
      this.queue.splice(insertIndex, 0, operation);
    }
  }

  /**
   * Process the write queue
   * @param writer - Function to execute write operations
   */
  async processQueue(writer: (operation: WriteOperation) => Promise<void>): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const operation = this.queue.shift()!;
      
      // Wait if this path is currently being written
      while (this.activePaths.has(operation.path)) {
        await this.sleep(100);
      }

      // Mark path as active
      this.activePaths.add(operation.path);
      this.currentOperation = operation;

      try {
        await writer(operation);
      } catch (error) {
        console.error(`Write queue error for ${operation.path}:`, error);
        // Continue processing even if one operation fails
      } finally {
        // Mark path as inactive
        this.activePaths.delete(operation.path);
        this.currentOperation = null;
      }
    }

    this.processing = false;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    this.currentOperation = null;
    // Don't clear activePaths as they may still be in progress
  }

  /**
   * Get queue status
   * @returns Current queue status
   */
  getStatus(): WriteQueueStatus {
    return {
      pending: this.queue.length,
      processing: this.processing,
      current: this.currentOperation
    };
  }

  /**
   * Check if a path is currently being written
   * @param path - File path to check
   * @returns True if path is being written
   */
  isPathActive(path: string): boolean {
    return this.activePaths.has(path);
  }

  /**
   * Get number of pending operations
   * @returns Number of operations in queue
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Sleep utility
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
