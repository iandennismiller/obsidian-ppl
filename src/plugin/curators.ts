/**
 * Curator Processor Registration
 * 
 * This module registers all curator processors with the curatorService.
 * It must be imported before any code that accesses curatorService.settings()
 * to ensure the processors are registered and their default settings are available.
 */

import { curatorService } from "src/models/curatorManager/curatorManager";

// Curator processor imports
import { uidProcessor } from 'src/curators/uidProcessor';
import { relatedFrontMatterProcessor } from 'src/curators/relatedFrontMatterProcessor';
import { relatedListProcessor } from 'src/curators/relatedListProcessor';
import { genderInferenceProcessor } from 'src/curators/genderInferenceProcessor';
import { genderRenderProcessor } from 'src/curators/genderRenderProcessor';

// Register all curator processors at module load time
// This ensures they're available when DEFAULT_SETTINGS is created
curatorService.registry.register(uidProcessor);
curatorService.registry.register(relatedFrontMatterProcessor);
curatorService.registry.register(relatedListProcessor);
curatorService.registry.register(genderInferenceProcessor);
curatorService.registry.register(genderRenderProcessor);

// Export for testing purposes
export const registeredProcessors = [
  uidProcessor,
  relatedFrontMatterProcessor,
  relatedListProcessor,
  genderInferenceProcessor,
  genderRenderProcessor
];
