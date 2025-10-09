/**
 * Curator Processor Registration
 * 
 * This module registers all curator processors with the curatorService.
 * It must be imported before any code that accesses curatorService.settings()
 * to ensure the processors are registered and their default settings are available.
 */

import { curatorService } from "src/models/curatorManager/curatorManager";

// Curator processor imports
import { UidProcessor } from 'src/curators/uidValidate';
import { VcardSyncPreProcessor } from 'src/curators/vcardSyncRead';
import { RelatedOtherProcessor } from 'src/curators/relatedOther';
import { RelatedFrontMatterProcessor } from 'src/curators/relatedFrontMatter';
import { RelatedListProcessor } from 'src/curators/relatedList';
import { GenderInferenceProcessor } from 'src/curators/genderInference';
import { GenderRenderProcessor } from 'src/curators/genderRender';
import { RelatedNamespaceUpgradeProcessor } from 'src/curators/namespaceUpgrade';
import { VcardSyncPostProcessor } from 'src/curators/vcardSyncWrite';
import { ContactToFrontMatterProcessor } from 'src/curators/contactToFrontMatter';
import { FrontMatterToContactProcessor } from 'src/curators/frontMatterToContact';

// Register all curator processors at module load time
// This ensures they're available when DEFAULT_SETTINGS is created
curatorService.register(UidProcessor);
curatorService.register(VcardSyncPreProcessor);
curatorService.register(RelatedOtherProcessor);
curatorService.register(RelatedFrontMatterProcessor);
curatorService.register(RelatedListProcessor);
curatorService.register(RelatedNamespaceUpgradeProcessor);
curatorService.register(GenderInferenceProcessor);
curatorService.register(GenderRenderProcessor);
curatorService.register(ContactToFrontMatterProcessor);
curatorService.register(FrontMatterToContactProcessor);
curatorService.register(VcardSyncPostProcessor);

// Export for testing purposes
export const registeredProcessors = [
  UidProcessor,
  VcardSyncPreProcessor,
  RelatedOtherProcessor,
  RelatedFrontMatterProcessor,
  RelatedListProcessor,
  RelatedNamespaceUpgradeProcessor,
  GenderInferenceProcessor,
  GenderRenderProcessor,
  ContactToFrontMatterProcessor,
  FrontMatterToContactProcessor,
  VcardSyncPostProcessor
];
