/**
 * Queue management for curator processing
 */

import type { CuratorQueItem, RunType, QueueStatus } from './types';
import type { ContactNote } from '../contactNote';

/**
 * Priority queue for curator processing
 */
export class CuratorQueue {
    private queue: CuratorQueItem[] = [];
    private isProcessing: boolean = false;
    private activeContact: string | null = null;
    
    /**
     * Add contact to queue
     */
    enqueue(contact: ContactNote, runType: RunType): void {
        // Check if contact already in queue
        const existing = this.queue.findIndex(
            item => item.contact === contact
        );
        
        if (existing !== -1) {
            // Update existing item with higher priority if needed
            const existingItem = this.queue[existing];
            if (this.getPriority(runType) > this.getPriority(existingItem.runType)) {
                this.queue[existing].runType = runType;
                this.queue[existing].timestamp = Date.now();
            }
        } else {
            // Add new item
            this.queue.push({
                contact,
                runType,
                timestamp: Date.now()
            });
        }
        
        // Sort queue by priority
        this.sortQueue();
    }
    
    /**
     * Get next item from queue
     */
    dequeue(): CuratorQueItem | undefined {
        return this.queue.shift();
    }
    
    /**
     * Peek at next item without removing
     */
    peek(): CuratorQueItem | undefined {
        return this.queue[0];
    }
    
    /**
     * Get queue length
     */
    length(): number {
        return this.queue.length;
    }
    
    /**
     * Check if queue is empty
     */
    isEmpty(): boolean {
        return this.queue.length === 0;
    }
    
    /**
     * Clear the queue
     */
    clear(): void {
        this.queue = [];
    }
    
    /**
     * Get queue status
     */
    getStatus(): QueueStatus {
        return {
            queueLength: this.queue.length,
            isProcessing: this.isProcessing,
            activeContact: this.activeContact
        };
    }
    
    /**
     * Set processing status
     */
    setProcessing(processing: boolean, contactName: string | null = null): void {
        this.isProcessing = processing;
        this.activeContact = contactName;
    }
    
    /**
     * Get priority value for run type (higher = more important)
     */
    private getPriority(runType: RunType): number {
        switch (runType) {
            case 'IMMEDIATELY':
                return 3;
            case 'UPCOMING':
                return 2;
            case 'IMPROVEMENT':
                return 1;
            default:
                return 0;
        }
    }
    
    /**
     * Sort queue by priority and timestamp
     */
    private sortQueue(): void {
        this.queue.sort((a, b) => {
            const priorityDiff = this.getPriority(b.runType) - this.getPriority(a.runType);
            if (priorityDiff !== 0) {
                return priorityDiff;
            }
            // If same priority, sort by timestamp (older first)
            return a.timestamp - b.timestamp;
        });
    }
}
