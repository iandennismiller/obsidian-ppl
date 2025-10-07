# Class Structure and Dependencies

## Overview

This document provides detailed class structure for the `/src` implementation, including interfaces, dependencies, and key methods for each component.

## Core Data Models

### VcardFile Model

**Location**: `src/models/vcardFile/`

#### Class: VcardFile

**Purpose**: Represents a vCard file with parsing and generation capabilities

**Properties**:
```typescript
- filename: string
- contacts: VCardData[]  // Array of contact data objects
- rawContent?: string    // Original file content
```

**Key Methods**:
```typescript
// Static factory methods
+ static fromFile(path: string): Promise<VcardFile>
+ static fromString(content: string): VcardFile
+ static empty(): VcardFile

// Instance methods
+ addContact(data: VCardData): void
+ removeContact(uid: string): void
+ getContact(uid: string): VCardData | undefined
+ getAllContacts(): VCardData[]
+ toVCardString(): string
+ save(path: string): Promise<void>
```

**Dependencies**:
- `vcard4` library: VCF parsing/generation
- `yaml` library: Frontmatter conversion
- `flat` library: Flattening/unflattening

**Specifications**: vcard-format.md, vcf-sync.md, library-integration.md

---

#### Helper Module: parsing.ts

**Purpose**: Parse VCF files to JavaScript objects

**Key Functions**:
```typescript
+ parseVcfFile(content: string): VCardData[]
+ parseVcfContact(vcardString: string): VCardData
+ vcardToFrontmatter(vcard: VCard4): Record<string, any>
+ flattenVCardData(nested: object): Record<string, any>
```

**Dependencies**: `vcard4`, `yaml`, `flat`

---

#### Helper Module: generation.ts

**Purpose**: Generate VCF files from JavaScript objects

**Key Functions**:
```typescript
+ generateVcfFile(contacts: VCardData[]): string
+ generateVcfContact(data: VCardData): string
+ frontmatterToVcard(frontmatter: Record<string, any>): VCard4
+ unflattenFrontmatter(flat: Record<string, any>): object
```

**Dependencies**: `vcard4`, `yaml`, `flat`

---

#### Type Definitions: types.ts

**Key Interfaces**:
```typescript
interface VCardData {
  UID: string;
  FN: string;
  VERSION?: string;
  [key: string]: any;  // Other vCard fields
}

interface VCardField {
  name: string;
  value: any;
  parameters?: Record<string, string>;
}
```

---

### ContactNote Model

**Location**: `src/models/contactNote/`

#### Class: ContactNote

**Purpose**: Manage individual contact note operations

**Properties**:
```typescript
- file: TFile                    // Obsidian file reference
- app: App                       // Obsidian app instance
- settings: ContactsPluginSettings
- frontmatter: Record<string, any>
- content: string
- uid?: string
- gender?: string
```

**Key Methods**:
```typescript
// Static factory methods
+ static fromFile(app: App, file: TFile, settings: ContactsPluginSettings): Promise<ContactNote>
+ static create(app: App, name: string, folder: string, settings: ContactsPluginSettings): Promise<ContactNote>

// Frontmatter operations
+ getFrontmatter(): Promise<Record<string, any>>
+ setFrontmatter(data: Record<string, any>): Promise<void>
+ updateFrontmatterField(key: string, value: any): Promise<void>

// UID operations
+ getUID(): string | undefined
+ setUID(uid: string): Promise<void>
+ ensureUID(): Promise<string>

// Relationship operations
+ getRelationships(): Relationship[]
+ addRelationship(type: string, targetUID: string): Promise<void>
+ removeRelationship(type: string, targetUID: string): Promise<void>
+ getRelatedSection(): string
+ updateRelatedSection(relationships: Relationship[]): Promise<void>

// Contact section operations
+ getContactSection(): ContactSectionData
+ updateContactSection(data: ContactSectionData): Promise<void>

// Gender operations
+ getGender(): string | undefined
+ setGender(gender: string): Promise<void>
+ inferGenderFromRelationships(): string | undefined

// Revision tracking
+ updateREV(): Promise<void>
+ getREV(): string | undefined
```

**Dependencies**:
- Obsidian API (App, TFile, Vault)
- `yaml` library
- `marked` library
- VcardFile model (for conversion)

**Specifications**: relationship-management.md, contact-section.md, gender-processing.md

---

#### Helper Module: relationships.ts

**Purpose**: Parse and manage relationships

**Key Functions**:
```typescript
+ parseRelatedSection(content: string): Relationship[]
+ generateRelatedSection(relationships: Relationship[]): string
+ parseRelatedFrontmatter(frontmatter: Record<string, any>): Relationship[]
+ generateRelatedFrontmatter(relationships: Relationship[]): Record<string, any>
+ normalizeRelationshipType(type: string): string
+ getGenderedRelationshipType(type: string, gender: string): string
+ inferGenderFromType(type: string): string | undefined
+ findRelatedHeading(content: string): { index: number; heading: string } | null
```

**Types**:
```typescript
interface Relationship {
  type: string;          // e.g., "friend", "colleague"
  targetUID: string;     // UID of related contact
  targetName?: string;   // Display name (for UI)
  namespace: 'urn:uuid' | 'uid' | 'name';
}
```

---

#### Helper Module: frontmatter.ts

**Purpose**: Frontmatter operations

**Key Functions**:
```typescript
+ parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string }
+ generateFrontmatter(data: Record<string, any>): string
+ updateFrontmatter(fileContent: string, updates: Record<string, any>): string
+ validateFrontmatter(data: Record<string, any>): ValidationResult
+ removeInvalidFields(data: Record<string, any>): Record<string, any>
```

---

#### Helper Module: markdown.ts

**Purpose**: Markdown content operations

**Key Functions**:
```typescript
+ parseContactSection(content: string): ContactSectionData
+ generateContactSection(data: ContactSectionData): string
+ extractHeadings(content: string): Heading[]
+ findSectionByHeading(content: string, heading: string): string | null
+ replaceSectionByHeading(content: string, heading: string, newContent: string): string
+ ensureSectionOrder(content: string, orderedHeadings: string[]): string
```

**Types**:
```typescript
interface ContactSectionData {
  emails: ContactField[];
  phones: ContactField[];
  urls: ContactField[];
  addresses: ContactField[];
}

interface ContactField {
  type?: string;  // e.g., "work", "home", "cell"
  value: string;
}

interface Heading {
  level: number;
  text: string;
  position: number;
}
```

---

### ContactManager Model

**Location**: `src/models/contactManager/`

#### Class: ContactManager

**Purpose**: Manage collection of contact notes in the vault

**Properties**:
```typescript
- app: App
- settings: ContactsPluginSettings
- contactCache: Map<string, ContactNote>  // UID -> ContactNote
- fileCache: Map<string, string>          // file path -> UID
```

**Key Methods**:
```typescript
// Initialization
+ constructor(app: App, settings: ContactsPluginSettings)
+ initializeCache(): Promise<void>
+ setupEventListeners(): void
+ cleanupEventListeners(): void

// Cache management
+ scanVault(): Promise<ContactNote[]>
+ addToCache(contact: ContactNote): void
+ removeFromCache(uid: string): void
+ getContactByUID(uid: string): ContactNote | undefined
+ getContactByPath(path: string): ContactNote | undefined
+ getAllContacts(): ContactNote[]

// Contact operations
+ createContact(name: string): Promise<ContactNote>
+ deleteContact(uid: string): Promise<void>
+ isContactFile(file: TFile): boolean

// Relationship synchronization
+ syncRelationships(sourceUID: string): Promise<void>
+ syncAllRelationships(): Promise<void>
+ ensureContactDataConsistency(): Promise<void>

// Event handlers (private)
- onFileCreate(file: TFile): Promise<void>
- onFileModify(file: TFile): Promise<void>
- onFileDelete(file: TFile): Promise<void>
- onFileRename(file: TFile, oldPath: string): Promise<void>
```

**Dependencies**:
- ContactNote model
- Obsidian API (App, MetadataCache, Vault, Events)
- Shared app context

**Specifications**: relationship-management.md, vcf-sync.md

---

#### Helper Module: cache.ts

**Purpose**: Contact caching and indexing

**Key Functions**:
```typescript
+ buildContactCache(app: App, settings: ContactsPluginSettings): Promise<Map<string, ContactNote>>
+ updateCacheEntry(cache: Map<string, ContactNote>, contact: ContactNote): void
+ removeCacheEntry(cache: Map<string, ContactNote>, uid: string): void
+ findContactFiles(app: App, folder: string): TFile[]
```

---

#### Helper Module: relationships.ts

**Purpose**: Bidirectional relationship synchronization

**Key Functions**:
```typescript
+ syncBidirectionalRelationships(
    source: ContactNote, 
    manager: ContactManager
  ): Promise<void>
+ ensureReverseRelationship(
    source: ContactNote,
    target: ContactNote,
    relType: string
  ): Promise<void>
+ getReverseRelationshipType(type: string): string
+ validateRelationshipGraph(contacts: ContactNote[]): ValidationResult[]
```

---

### VcardManager Model

**Location**: `src/models/vcardManager/`

#### Class: VcardManager

**Purpose**: Manage VCF file collection and write operations

**Properties**:
```typescript
- app: App
- settings: ContactsPluginSettings
- writeQueue: WriteQueue
- vcardCache: Map<string, VcardFile>
```

**Key Methods**:
```typescript
// Initialization
+ constructor(app: App, settings: ContactsPluginSettings)
+ initialize(): Promise<void>

// VCF file operations
+ loadVcardFile(path: string): Promise<VcardFile>
+ saveVcardFile(path: string, vcard: VcardFile): Promise<void>
+ syncContactToVcf(contact: ContactNote): Promise<void>
+ syncVcfToContact(vcfPath: string, contactUID: string): Promise<void>

// Batch operations
+ exportAllContacts(contacts: ContactNote[]): Promise<void>
+ importAllVcards(vcfFiles: string[]): Promise<ContactNote[]>

// Single vs. multi-file mode
+ getSingleVcfPath(): string
+ getVcfPathForUID(uid: string): string
```

**Dependencies**:
- VcardFile model
- ContactNote model
- Obsidian API (Vault)

**Specifications**: vcf-sync.md

---

#### Helper Module: writeQueue.ts

**Purpose**: Write queue system for controlled file operations

**Key Functions**:
```typescript
class WriteQueue {
  + enqueue(operation: WriteOperation): Promise<void>
  + processQueue(): Promise<void>
  + clear(): void
}

interface WriteOperation {
  path: string;
  data: string;
  priority: number;
}
```

---

## Curator Pipeline System

### CuratorManager Model

**Location**: `src/models/curatorManager/`

#### Class: CuratorManager

**Purpose**: Coordinate processor execution and manage the curator pipeline

**Properties**:
```typescript
- app: App
- settings: ContactsPluginSettings
- contactManager: ContactManager
- processors: Map<string, CuratorProcessor>
- processingQueue: CuratorQueItem[]
- isProcessing: boolean
```

**Key Methods**:
```typescript
// Initialization
+ constructor(app: App, settings: ContactsPluginSettings, contactManager: ContactManager)
+ registerProcessor(processor: CuratorProcessor): void
+ getProcessor(name: string): CuratorProcessor | undefined

// Queue management
+ enqueueContact(contact: ContactNote, runType: RunType): void
+ processQueue(): Promise<void>

// Processor execution
+ runProcessors(contact: ContactNote, runType: RunType): Promise<void>
+ runProcessor(processor: CuratorProcessor, contact: ContactNote): Promise<void>

// Command registration
+ registerCommands(plugin: Plugin): void

// Settings
+ getProcessorSettings(): CuratorSettingProperties[]
```

**Dependencies**:
- ContactManager model
- ContactNote model
- Curator processor interfaces
- Obsidian API (Plugin, Command)

**Specifications**: curator-pipeline.md

---

#### Interface: CuratorProcessor

**Location**: `src/models/curatorManager/CuratorProcessor.ts`

**Purpose**: Define processor interface

```typescript
interface CuratorProcessor {
  name: string;
  description: string;
  runType: RunType;
  dependencies: string[];  // Names of processors this depends on
  
  shouldRun(contact: ContactNote, settings: ContactsPluginSettings): Promise<boolean>;
  process(contact: ContactNote, manager: ContactManager, settings: ContactsPluginSettings): Promise<void>;
  
  // Optional settings
  settingProperties?: CuratorSettingProperties;
}
```

---

#### Enum: RunType

**Location**: `src/models/curatorManager/RunType.ts`

```typescript
enum RunType {
  IMMEDIATELY = 'IMMEDIATELY',   // Run as soon as data changes
  UPCOMING = 'UPCOMING',         // Run on schedule or when triggered
  IMPROVEMENT = 'IMPROVEMENT'    // Run periodically for data quality
}
```

---

#### Type: CuratorQueItem

**Location**: `src/models/curatorManager/CuratorQueItem.ts`

```typescript
interface CuratorQueItem {
  contact: ContactNote;
  runType: RunType;
  timestamp: number;
}
```

---

### Standard Curator Processors

**Location**: `src/curators/`

Each processor implements the `CuratorProcessor` interface.

#### uidProcessor.ts
```typescript
class UidProcessor implements CuratorProcessor {
  name = 'uid';
  runType = RunType.IMMEDIATELY;
  dependencies = [];
  
  shouldRun(contact: ContactNote): Promise<boolean> {
    return !contact.getUID();
  }
  
  process(contact: ContactNote): Promise<void> {
    // Generate and set UID if missing
  }
}
```

#### relatedFrontMatterProcessor.ts
```typescript
class RelatedFrontMatterProcessor implements CuratorProcessor {
  name = 'relatedFrontMatter';
  runType = RunType.UPCOMING;
  dependencies = [];
  
  shouldRun(contact: ContactNote): Promise<boolean> {
    // Check if Related section has items not in frontmatter
  }
  
  process(contact: ContactNote): Promise<void> {
    // Sync Related section to frontmatter
  }
}
```

#### relatedListProcessor.ts
```typescript
class RelatedListProcessor implements CuratorProcessor {
  name = 'relatedList';
  runType = RunType.UPCOMING;
  dependencies = [];
  
  shouldRun(contact: ContactNote): Promise<boolean> {
    // Check if frontmatter has items not in Related section
  }
  
  process(contact: ContactNote): Promise<void> {
    // Sync frontmatter to Related section
  }
}
```

#### genderInferenceProcessor.ts
```typescript
class GenderInferenceProcessor implements CuratorProcessor {
  name = 'genderInference';
  runType = RunType.UPCOMING;
  dependencies = ['relatedFrontMatter'];
  
  shouldRun(contact: ContactNote): Promise<boolean> {
    // Check if relationships have gendered terms
  }
  
  process(contact: ContactNote, manager: ContactManager): Promise<void> {
    // Infer gender from relationship terms and update related contacts
  }
}
```

#### genderRenderProcessor.ts
```typescript
class GenderRenderProcessor implements CuratorProcessor {
  name = 'genderRender';
  runType = RunType.UPCOMING;
  dependencies = ['genderInference'];
  
  shouldRun(contact: ContactNote): Promise<boolean> {
    // Check if gender is set and relationships need rendering
  }
  
  process(contact: ContactNote): Promise<void> {
    // Render genderless types as gendered terms
  }
}
```

#### contactSectionToFrontmatterProcessor.ts
```typescript
class ContactSectionToFrontmatterProcessor implements CuratorProcessor {
  name = 'contactSectionToFrontmatter';
  runType = RunType.UPCOMING;
  dependencies = [];
  
  shouldRun(contact: ContactNote): Promise<boolean> {
    // Check if Contact section has data not in frontmatter
  }
  
  process(contact: ContactNote): Promise<void> {
    // Parse Contact section and update frontmatter
  }
}
```

#### frontmatterToContactSectionProcessor.ts
```typescript
class FrontmatterToContactSectionProcessor implements CuratorProcessor {
  name = 'frontmatterToContactSection';
  runType = RunType.UPCOMING;
  dependencies = [];
  
  shouldRun(contact: ContactNote): Promise<boolean> {
    // Check if frontmatter has contact data not in Contact section
  }
  
  process(contact: ContactNote): Promise<void> {
    // Generate Contact section from frontmatter
  }
}
```

---

## Plugin Services

### SyncWatcher Service

**Location**: `src/plugin/services/syncWatcher.ts`

#### Class: SyncWatcher

**Purpose**: Monitor VCF watch folder for external changes

**Properties**:
```typescript
- app: App
- settings: ContactsPluginSettings
- pollingInterval: number
- intervalId?: number
- lastChecked: Map<string, number>  // file path -> timestamp
```

**Key Methods**:
```typescript
+ constructor(app: App, settings: ContactsPluginSettings)
+ start(): Promise<void>
+ stop(): void
+ checkForChanges(): Promise<void>
- handleFileChange(path: string): Promise<void>
- shouldIgnoreFile(path: string, uid?: string): boolean
```

---

### DropHandler Service

**Location**: `src/plugin/services/dropHandler.ts`

**Function**: setupVcardDropHandler

**Purpose**: Handle VCF files dropped into vault

```typescript
export function setupVcardDropHandler(
  app: App, 
  settings: ContactsPluginSettings
): () => void {
  // Returns cleanup function
}
```

**Functionality**:
- Watch for .vcf file creation events
- Import contacts from VCF
- Move VCF to watch folder
- Show notification to user

---

### MetadataCacheWaiter Service

**Location**: `src/plugin/services/metadataCacheWaiter.ts`

**Function**: waitForMetadataCache

**Purpose**: Wait for Obsidian metadata cache to be ready

```typescript
export async function waitForMetadataCache(app: App): Promise<void> {
  // Wait until metadata cache is populated
}
```

---

### vdirsyncer Service

**Location**: `src/plugin/services/vdirsyncerService.ts`

**Functions**:
```typescript
+ readVdirsyncerConfig(path: string): Promise<string>
+ writeVdirsyncerConfig(path: string, content: string): Promise<void>
+ validateVdirsyncerConfig(content: string): ValidationResult
+ getDefaultVdirsyncerPath(): string
```

---

## User Interface Components

### FolderSuggest

**Location**: `src/plugin/ui/FolderSuggest.ts`

**Class**: FolderSuggest extends AbstractInputSuggest

**Purpose**: Provide folder path auto-completion in settings

**Methods**:
```typescript
+ getSuggestions(inputStr: string): TFolder[]
+ renderSuggestion(folder: TFolder, el: HTMLElement): void
+ selectSuggestion(folder: TFolder): void
```

---

### vdirsyncerConfigModal

**Location**: `src/plugin/ui/modals/vdirsyncerConfigModal.ts`

**Class**: VdirsyncerConfigModal extends Modal

**Purpose**: Edit vdirsyncer configuration

**Properties**:
```typescript
- app: App
- settings: ContactsPluginSettings
- configContent: string
```

**Methods**:
```typescript
+ onOpen(): void
+ onClose(): void
+ save(): Promise<void>
```

---

## Dependency Graph

```
main.ts
  ├─> ContactsPlugin
      ├─> ContactManager
      │   └─> ContactNote
      │       └─> VcardFile
      ├─> CuratorManager
      │   ├─> ContactManager
      │   └─> Processors (curators/)
      │       ├─> uidProcessor
      │       ├─> relatedFrontMatterProcessor
      │       ├─> relatedListProcessor
      │       ├─> genderInferenceProcessor
      │       ├─> genderRenderProcessor
      │       ├─> contactSectionToFrontmatterProcessor
      │       ├─> frontmatterToContactSectionProcessor
      │       ├─> vcardSyncPreProcessor
      │       ├─> vcardSyncPostProcessor
      │       └─> relatedNamespaceUpgradeProcessor
      ├─> SyncWatcher
      │   └─> VcardManager
      │       ├─> VcardFile
      │       └─> ContactNote
      ├─> dropHandler
      │   └─> VcardManager
      └─> UI Components
          ├─> FolderSuggest
          └─> vdirsyncerConfigModal
```

## Implementation Guidelines

### For Each Class

1. **Create directory structure**
   - One directory per model
   - Separate files for main class, helpers, types

2. **Define interfaces first**
   - Create types.ts with all interfaces
   - Define clear contracts

3. **Implement core functionality**
   - Start with basic CRUD operations
   - Add complex logic incrementally

4. **Add tests**
   - Unit tests for each method
   - Integration tests for interactions

5. **Document**
   - JSDoc comments for public methods
   - README if needed for complex modules

### Testing Strategy

1. **Mock Obsidian API**
   - Use fixtures/emptyObsidianMock.ts
   - Add mocks as needed

2. **Test data**
   - Sample VCF files in fixtures/data/
   - Test contact notes
   - Edge cases

3. **Test organization**
   - tests/units/ for unit tests
   - tests/stories/ for integration tests
   - Mirror src/ structure

## Next Steps

1. Begin with VcardFile model (simplest, no Obsidian dependencies)
2. Add ContactNote model (builds on VcardFile)
3. Implement ContactManager (uses ContactNote)
4. Build CuratorManager and basic processors
5. Add remaining services
6. Complete UI components
7. Comprehensive testing

## References

- [Implementation Roadmap](implementation-roadmap.md)
- [Specifications](../specifications/README.md)
- [User Stories](../user-stories.md)
