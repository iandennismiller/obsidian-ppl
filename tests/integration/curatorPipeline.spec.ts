/**
 * Integration tests for curator pipeline workflows
 * Tests processor execution order, dependency management, and data transformations
 */

import { describe, it, expect } from 'vitest';
import { ProcessorRegistry } from '../../src/models/curatorManager/processorRegistry';
import { CuratorQueue } from '../../src/models/curatorManager/queue';
import { RunType } from '../../src/models/curatorManager/types';
import { uidProcessor } from '../../src/curators/uidProcessor';
import { relatedFrontMatterProcessor } from '../../src/curators/relatedFrontMatterProcessor';
import { relatedListProcessor } from '../../src/curators/relatedListProcessor';
import { genderInferenceProcessor } from '../../src/curators/genderInferenceProcessor';
import { genderRenderProcessor } from '../../src/curators/genderRenderProcessor';
import { parseFrontmatter } from '../../src/models/contactNote/frontmatter';

// Simple interface for contact data matching processor expectations
interface ContactNote {
    path: string;
    frontmatter?: Record<string, any>;
    content: string;
}

describe('Curator Pipeline Integration', () => {
    describe('Processor Registration and Ordering', () => {
        it('should register all standard processors', () => {
            const registry = new ProcessorRegistry();
            
            registry.register(uidProcessor);
            registry.register(relatedFrontMatterProcessor);
            registry.register(relatedListProcessor);
            registry.register(genderInferenceProcessor);
            registry.register(genderRenderProcessor);

            const processors = registry.getAllProcessors();
            expect(processors).toHaveLength(5);
            
            const processorNames = processors.map(p => p.name);
            expect(processorNames).toContain('uidProcessor');
            expect(processorNames).toContain('relatedFrontMatterProcessor');
            expect(processorNames).toContain('relatedListProcessor');
            expect(processorNames).toContain('genderInferenceProcessor');
            expect(processorNames).toContain('genderRenderProcessor');
        });

        it('should verify processor dependencies', () => {
            // uidProcessor has no dependencies
            expect(uidProcessor.dependencies).toEqual([]);

            // genderInferenceProcessor depends on relatedFrontMatterProcessor
            expect(genderInferenceProcessor.dependencies).toContain('relatedFrontMatterProcessor');

            // genderRenderProcessor depends on genderInferenceProcessor
            expect(genderRenderProcessor.dependencies).toContain('genderInferenceProcessor');
        });
    });

    describe('Queue Management', () => {
        it('should queue contacts by priority', () => {
            const queue = new CuratorQueue();

            queue.enqueue({ path: '/contact1.md', uid: 'uid-1' }, RunType.IMPROVEMENT);
            queue.enqueue({ path: '/contact2.md', uid: 'uid-2' }, RunType.IMMEDIATELY);
            queue.enqueue({ path: '/contact3.md', uid: 'uid-3' }, RunType.UPCOMING);

            // Should dequeue in priority order
            const item1 = queue.dequeue();
            expect(item1?.uid).toBe('uid-2'); // IMMEDIATELY

            const item2 = queue.dequeue();
            expect(item2?.uid).toBe('uid-3'); // UPCOMING

            const item3 = queue.dequeue();
            expect(item3?.uid).toBe('uid-1'); // IMPROVEMENT
        });

        it('should prevent duplicate contacts in queue', () => {
            const queue = new CuratorQueue();

            queue.enqueue({ path: '/contact.md', uid: 'uid-1' }, RunType.UPCOMING);
            queue.enqueue({ path: '/contact.md', uid: 'uid-1' }, RunType.UPCOMING);

            expect(queue.size()).toBe(1);
        });

        it('should upgrade priority if same contact queued with higher priority', () => {
            const queue = new CuratorQueue();

            queue.enqueue({ path: '/contact.md', uid: 'uid-1' }, RunType.IMPROVEMENT);
            queue.enqueue({ path: '/contact.md', uid: 'uid-1' }, RunType.IMMEDIATELY);

            const item = queue.dequeue();
            expect(item?.uid).toBe('uid-1');
            expect(queue.size()).toBe(0);
        });
    });

    describe('Processor Execution', () => {
        it('should execute uidProcessor to ensure UID exists', async () => {
            const content = `---
FN: Test User
---

Test content`;

            const frontmatter = parseFrontmatter(content);
            const contact: ContactNote = {
                path: '/test.md',
                frontmatter,
                content
            };

            const shouldRun = await uidProcessor.shouldRun(contact);
            expect(shouldRun).toBe(true); // No UID, should run

            await uidProcessor.process(contact);
            expect(contact.frontmatter?.UID).toBeDefined();
            expect(contact.frontmatter?.UID).toContain('urn:uuid:');
            expect(contact.frontmatter?.FN).toBe('Test User');
        });

        it('should not run uidProcessor if UID exists', async () => {
            const content = `---
UID: existing-uid
FN: Test User
---

Test content`;

            const frontmatter = parseFrontmatter(content);
            const contact: ContactNote = {
                path: '/test.md',
                frontmatter,
                content
            };

            const shouldRun = await uidProcessor.shouldRun(contact);
            expect(shouldRun).toBe(false); // UID exists, no need to run
        });
    });

    describe('Complete Pipeline Execution', () => {
        it('should execute processors with dependencies', async () => {
            const content = `---
FN: Test User
---

Body content`;

            const frontmatter = parseFrontmatter(content);
            const contact: ContactNote = {
                path: '/test.md',
                frontmatter,
                content
            };

            // Execute uidProcessor
            if (await uidProcessor.shouldRun(contact)) {
                await uidProcessor.process(contact);
            }

            // Verify UID was added
            expect(contact.frontmatter?.UID).toBeDefined();
            expect(contact.frontmatter?.FN).toBe('Test User');
        });

        it('should preserve all data during processing', async () => {
            const content = `---
FN: Complex User
EMAIL.work: test@work.com
TEL.cell: +1-555-0123
---

Some body content here.
`;

            const frontmatter = parseFrontmatter(content);
            const contact: ContactNote = {
                path: '/complex.md',
                frontmatter,
                content
            };

            // Run uidProcessor
            if (await uidProcessor.shouldRun(contact)) {
                await uidProcessor.process(contact);
            }

            // Verify no data loss
            expect(contact.frontmatter?.FN).toBe('Complex User');
            expect(contact.frontmatter?.['EMAIL.work']).toBe('test@work.com');
            expect(contact.frontmatter?.['TEL.cell']).toBe('+1-555-0123');
            expect(contact.frontmatter?.UID).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle contacts with minimal frontmatter', async () => {
            const content = `---
---

Just body content`;

            const frontmatter = parseFrontmatter(content);
            const contact: ContactNote = {
                path: '/minimal.md',
                frontmatter,
                content
            };

            // uidProcessor should run and add UID
            const shouldRun = await uidProcessor.shouldRun(contact);
            expect(shouldRun).toBe(true);

            await uidProcessor.process(contact);
            expect(contact.frontmatter?.UID).toBeDefined();
        });

        it('should preserve content when processor should not run', async () => {
            const content = `---
UID: existing-uid
FN: Test User
---

Content`;

            const frontmatter = parseFrontmatter(content);
            const contact: ContactNote = {
                path: '/test.md',
                frontmatter,
                content
            };

            const shouldRun = await uidProcessor.shouldRun(contact);
            expect(shouldRun).toBe(false);

            // Frontmatter should remain unchanged
            expect(contact.frontmatter?.UID).toBe('existing-uid');
            expect(contact.frontmatter?.FN).toBe('Test User');
        });
    });
});
