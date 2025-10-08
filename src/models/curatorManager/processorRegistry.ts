/**
 * Processor registry and management
 */

import type { CuratorProcessor } from './types';

/**
 * Registry for curator processors
 */
export class ProcessorRegistry {
    private processors: Map<string, CuratorProcessor> = new Map();
    
    /**
     * Register a processor
     */
    register(processor: CuratorProcessor): void {
        if (this.processors.has(processor.name)) {
            console.warn(`Processor ${processor.name} is already registered, overwriting`);
        }
        this.processors.set(processor.name, processor);
    }
    
    /**
     * Get a processor by name
     */
    get(name: string): CuratorProcessor | undefined {
        return this.processors.get(name);
    }
    
    /**
     * Get all registered processors
     */
    getAll(): CuratorProcessor[] {
        return Array.from(this.processors.values());
    }
    
    /**
     * Get processor names
     */
    getNames(): string[] {
        return Array.from(this.processors.keys());
    }
    
    /**
     * Check if processor is registered
     */
    has(name: string): boolean {
        return this.processors.has(name);
    }
    
    /**
     * Remove a processor
     */
    remove(name: string): boolean {
        return this.processors.delete(name);
    }
    
    /**
     * Clear all processors
     */
    clear(): void {
        this.processors.clear();
    }
    
    /**
     * Get processors sorted by dependencies
     * Processors with no dependencies come first
     * Processors that depend on others come after their dependencies
     */
    getSorted(): CuratorProcessor[] {
        const processors = this.getAll();
        const sorted: CuratorProcessor[] = [];
        const added = new Set<string>();
        
        // Helper to add processor and its dependencies
        const addProcessor = (processor: CuratorProcessor) => {
            if (added.has(processor.name)) {
                return;
            }
            
            // First add all dependencies
            for (const depName of processor.dependencies) {
                const dep = this.get(depName);
                if (dep && !added.has(depName)) {
                    addProcessor(dep);
                }
            }
            
            // Then add this processor
            sorted.push(processor);
            added.add(processor.name);
        };
        
        // Add all processors
        for (const processor of processors) {
            addProcessor(processor);
        }
        
        return sorted;
    }
}
