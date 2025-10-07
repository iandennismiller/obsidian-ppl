/**
 * Type definitions for VcardManager model
 */

/**
 * Write operation for the write queue
 */
export interface WriteOperation {
  /** File path to write to */
  path: string;
  /** Content to write */
  data: string;
  /** Operation priority (higher = more urgent) */
  priority: number;
  /** Timestamp when operation was queued */
  timestamp: number;
}

/**
 * Write queue status
 */
export interface WriteQueueStatus {
  /** Number of operations in queue */
  pending: number;
  /** Whether queue is currently processing */
  processing: boolean;
  /** Current operation being processed */
  current: WriteOperation | null;
}

/**
 * Batch operation progress
 */
export interface BatchProgress {
  /** Total number of items */
  total: number;
  /** Number of completed items */
  completed: number;
  /** Number of failed items */
  failed: number;
  /** Current item being processed */
  current: string | null;
  /** Whether operation is complete */
  done: boolean;
}

/**
 * Batch export options
 */
export interface BatchExportOptions {
  /** Whether to export to single file or multiple files */
  singleFile: boolean;
  /** Path for single file export */
  singleFilePath?: string;
  /** Directory for multiple file export */
  multiFileDirectory?: string;
  /** Whether to overwrite existing files */
  overwrite: boolean;
}

/**
 * Batch import options
 */
export interface BatchImportOptions {
  /** Whether to create notes for imported contacts */
  createNotes: boolean;
  /** Target folder for created notes */
  targetFolder?: string;
  /** Whether to overwrite existing contacts */
  overwrite: boolean;
}
