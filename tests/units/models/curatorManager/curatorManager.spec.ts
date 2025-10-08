/**
 * Tests for curator manager components
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {  
    RunType, 
    ProcessorRegistry, 
    CuratorQueue,
    type CuratorProcessor,
    type ContactNote
} from '../../../../src/models/curatorManager';

// Mock ContactNote interface
interface MockContactNote {
    path: string;
    frontmatter?: Record<string, any>;
    content: string;
}

describe('CuratorManager', () => {
    describe('ProcessorRegistry', () => {
        let registry: ProcessorRegistry;
        
        beforeEach(() => {
            registry = new ProcessorRegistry();
        });
        
        it('should register a processor', () => {
            const processor: CuratorProcessor = {
                name: 'test-processor',
                description: 'Test processor',
                runType: RunType.IMMEDIATELY,
                dependencies: [],
                shouldRun: async () => true,
                process: async () => {}
            };
            
            registry.register(processor);
            expect(registry.has('test-processor')).toBe(true);
            expect(registry.get('test-processor')).toBe(processor);
        });
        
        it('should get all processors', () => {
            const p1: CuratorProcessor = {
                name: 'p1',
                description: 'Processor 1',
                runType: RunType.IMMEDIATELY,
                dependencies: [],
                shouldRun: async () => true,
                process: async () => {}
            };
            const p2: CuratorProcessor = {
                name: 'p2',
                description: 'Processor 2',
                runType: RunType.UPCOMING,
                dependencies: [],
                shouldRun: async () => true,
                process: async () => {}
            };
            
            registry.register(p1);
            registry.register(p2);
            
            const all = registry.getAll();
            expect(all).toHaveLength(2);
            expect(all).toContain(p1);
            expect(all).toContain(p2);
        });
        
        it('should get processor names', () => {
            const p1: CuratorProcessor = {
                name: 'p1',
                description: 'Processor 1',
                runType: RunType.IMMEDIATELY,
                dependencies: [],
                shouldRun: async () => true,
                process: async () => {}
            };
            const p2: CuratorProcessor = {
                name: 'p2',
                description: 'Processor 2',
                runType: RunType.UPCOMING,
                dependencies: [],
                shouldRun: async () => true,
                process: async () => {}
            };
            
            registry.register(p1);
            registry.register(p2);
            
            const names = registry.getNames();
            expect(names).toContain('p1');
            expect(names).toContain('p2');
        });
        
        it('should remove a processor', () => {
            const processor: CuratorProcessor = {
                name: 'test',
                description: 'Test',
                runType: RunType.IMMEDIATELY,
                dependencies: [],
                shouldRun: async () => true,
                process: async () => {}
            };
            
            registry.register(processor);
            expect(registry.has('test')).toBe(true);
            
            registry.remove('test');
            expect(registry.has('test')).toBe(false);
        });
        
        it('should clear all processors', () => {
            const p1: CuratorProcessor = {
                name: 'p1',
                description: 'Processor 1',
                runType: RunType.IMMEDIATELY,
                dependencies: [],
                shouldRun: async () => true,
                process: async () => {}
            };
            const p2: CuratorProcessor = {
                name: 'p2',
                description: 'Processor 2',
                runType: RunType.UPCOMING,
                dependencies: [],
                shouldRun: async () => true,
                process: async () => {}
            };
            
            registry.register(p1);
            registry.register(p2);
            expect(registry.getAll()).toHaveLength(2);
            
            registry.clear();
            expect(registry.getAll()).toHaveLength(0);
        });
        
        it('should sort processors by dependencies', () => {
            const p1: CuratorProcessor = {
                name: 'p1',
                description: 'Has no dependencies',
                runType: RunType.IMMEDIATELY,
                dependencies: [],
                shouldRun: async () => true,
                process: async () => {}
            };
            const p2: CuratorProcessor = {
                name: 'p2',
                description: 'Depends on p1',
                runType: RunType.UPCOMING,
                dependencies: ['p1'],
                shouldRun: async () => true,
                process: async () => {}
            };
            const p3: CuratorProcessor = {
                name: 'p3',
                description: 'Depends on p2',
                runType: RunType.UPCOMING,
                dependencies: ['p2'],
                shouldRun: async () => true,
                process: async () => {}
            };
            
            // Register in reverse order
            registry.register(p3);
            registry.register(p2);
            registry.register(p1);
            
            const sorted = registry.getSorted();
            expect(sorted).toHaveLength(3);
            expect(sorted[0].name).toBe('p1');
            expect(sorted[1].name).toBe('p2');
            expect(sorted[2].name).toBe('p3');
        });
        
        it('should handle multiple dependencies', () => {
            const p1: CuratorProcessor = {
                name: 'p1',
                description: 'Base',
                runType: RunType.IMMEDIATELY,
                dependencies: [],
                shouldRun: async () => true,
                process: async () => {}
            };
            const p2: CuratorProcessor = {
                name: 'p2',
                description: 'Base',
                runType: RunType.IMMEDIATELY,
                dependencies: [],
                shouldRun: async () => true,
                process: async () => {}
            };
            const p3: CuratorProcessor = {
                name: 'p3',
                description: 'Depends on p1 and p2',
                runType: RunType.UPCOMING,
                dependencies: ['p1', 'p2'],
                shouldRun: async () => true,
                process: async () => {}
            };
            
            registry.register(p3);
            registry.register(p1);
            registry.register(p2);
            
            const sorted = registry.getSorted();
            expect(sorted).toHaveLength(3);
            
            // p3 should be last
            expect(sorted[2].name).toBe('p3');
            
            // p1 and p2 should be before p3
            const p1Index = sorted.findIndex(p => p.name === 'p1');
            const p2Index = sorted.findIndex(p => p.name === 'p2');
            const p3Index = sorted.findIndex(p => p.name === 'p3');
            
            expect(p1Index).toBeLessThan(p3Index);
            expect(p2Index).toBeLessThan(p3Index);
        });
    });
    
    describe('CuratorQueue', () => {
        let queue: CuratorQueue;
        let mockContact: MockContactNote;
        
        beforeEach(() => {
            queue = new CuratorQueue();
            mockContact = {
                path: '/test.md',
                frontmatter: { UID: 'test-uid', FN: 'Test' },
                content: '# Test'
            } as any;
        });
        
        it('should enqueue contacts', () => {
            queue.enqueue(mockContact as any, RunType.IMMEDIATELY);
            expect(queue.length()).toBe(1);
        });
        
        it('should dequeue contacts', () => {
            queue.enqueue(mockContact as any, RunType.IMMEDIATELY);
            const item = queue.dequeue();
            
            expect(item).toBeDefined();
            expect(item?.contact).toBe(mockContact);
            expect(queue.isEmpty()).toBe(true);
        });
        
        it('should peek without removing', () => {
            queue.enqueue(mockContact as any, RunType.IMMEDIATELY);
            const item = queue.peek();
            
            expect(item).toBeDefined();
            expect(item?.contact).toBe(mockContact);
            expect(queue.length()).toBe(1);
        });
        
        it('should prioritize IMMEDIATELY over UPCOMING', () => {
            const contact1 = { ...mockContact, path: '/c1.md' } as any;
            const contact2 = { ...mockContact, path: '/c2.md' } as any;
            
            queue.enqueue(contact1, RunType.UPCOMING);
            queue.enqueue(contact2, RunType.IMMEDIATELY);
            
            const first = queue.dequeue();
            expect(first?.contact).toBe(contact2);
            expect(first?.runType).toBe(RunType.IMMEDIATELY);
        });
        
        it('should prioritize UPCOMING over IMPROVEMENT', () => {
            const contact1 = { ...mockContact, path: '/c1.md' } as any;
            const contact2 = { ...mockContact, path: '/c2.md' } as any;
            
            queue.enqueue(contact1, RunType.IMPROVEMENT);
            queue.enqueue(contact2, RunType.UPCOMING);
            
            const first = queue.dequeue();
            expect(first?.contact).toBe(contact2);
            expect(first?.runType).toBe(RunType.UPCOMING);
        });
        
        it('should update priority for duplicate contacts', () => {
            queue.enqueue(mockContact as any, RunType.IMPROVEMENT);
            queue.enqueue(mockContact as any, RunType.IMMEDIATELY);
            
            expect(queue.length()).toBe(1);
            const item = queue.peek();
            expect(item?.runType).toBe(RunType.IMMEDIATELY);
        });
        
        it('should not downgrade priority for duplicate contacts', () => {
            queue.enqueue(mockContact as any, RunType.IMMEDIATELY);
            queue.enqueue(mockContact as any, RunType.IMPROVEMENT);
            
            expect(queue.length()).toBe(1);
            const item = queue.peek();
            expect(item?.runType).toBe(RunType.IMMEDIATELY);
        });
        
        it('should clear the queue', () => {
            queue.enqueue(mockContact as any, RunType.IMMEDIATELY);
            queue.enqueue({ ...mockContact, path: '/c2.md' } as any, RunType.UPCOMING);
            
            expect(queue.length()).toBe(2);
            queue.clear();
            expect(queue.isEmpty()).toBe(true);
        });
        
        it('should get queue status', () => {
            queue.enqueue(mockContact as any, RunType.IMMEDIATELY);
            
            const status = queue.getStatus();
            expect(status.queueLength).toBe(1);
            expect(status.isProcessing).toBe(false);
            expect(status.activeContact).toBeNull();
        });
        
        it('should track processing status', () => {
            queue.setProcessing(true, 'Test Contact');
            
            const status = queue.getStatus();
            expect(status.isProcessing).toBe(true);
            expect(status.activeContact).toBe('Test Contact');
            
            queue.setProcessing(false);
            
            const status2 = queue.getStatus();
            expect(status2.isProcessing).toBe(false);
            expect(status2.activeContact).toBeNull();
        });
        
        it('should maintain FIFO order for same priority', () => {
            const contact1 = { ...mockContact, path: '/c1.md' } as any;
            const contact2 = { ...mockContact, path: '/c2.md' } as any;
            const contact3 = { ...mockContact, path: '/c3.md' } as any;
            
            queue.enqueue(contact1, RunType.UPCOMING);
            queue.enqueue(contact2, RunType.UPCOMING);
            queue.enqueue(contact3, RunType.UPCOMING);
            
            expect(queue.dequeue()?.contact).toBe(contact1);
            expect(queue.dequeue()?.contact).toBe(contact2);
            expect(queue.dequeue()?.contact).toBe(contact3);
        });
    });
});
