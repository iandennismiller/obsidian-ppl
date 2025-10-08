/**
 * VcardManager module exports
 */

export type {
  WriteOperation,
  WriteQueueStatus,
  BatchProgress,
  BatchExportOptions,
  BatchImportOptions
} from './types';

export { WriteQueue } from './writeQueue';

export {
  createBatchProgress,
  updateBatchProgress,
  markBatchItemCompleted,
  markBatchItemFailed,
  getBatchProgressPercentage,
  isBatchComplete,
  getBatchSummary
} from './batchProcessing';
