# Implementation Roadmap for Obsidian VCF Contacts Plugin

## Executive Summary

This document provides a phased implementation plan for building the `/src` classes based on the project specifications. The plan follows a bottom-up approach, building core infrastructure first before adding advanced features.

## Project Overview

The Obsidian VCF Contacts Plugin manages contacts using the vCard 4.0 standard format, with features including:
- Contact management within Obsidian using markdown notes
- VCF import/export with bidirectional synchronization
- Relationship tracking with gender-aware processing
- Contact section for human-readable contact information
- Integration with external contact systems via CardDAV (vdirsyncer)

## Key Technical Constraints

### Libraries to Use
- **vcard4**: RFC 6350 compliant vCard 4.0 parsing and generation
- **yaml**: YAML 1.2 frontmatter parsing and generation
- **flat**: Converting between flat keys (e.g., `RELATED.friend.0`) and nested objects
- **marked**: Standard markdown parsing and rendering

### Architecture Principles
1. **Model-based organization**: Domain logic in model classes
2. **Processor pattern**: Data operations as curator processors
3. **Sequential execution**: Prevent race conditions in data processing
4. **Separation of concerns**: Parsing, business logic, and UI separated
5. **Dependency injection**: For testability and modularity

## Current State Analysis

### What Exists
- `src/main.ts`: Plugin entry point with lifecycle management
- `src/plugin/settings.ts`: Settings interface and UI (references missing dependencies)
- `src/plugin/context/`: Shared app and settings context
- Project documentation in `/project`:
  - Technical specifications
  - User stories
  - Reference documentation (vCard, Obsidian API)

### What's Missing (referenced in main.ts)
- `src/models/vcardFile/`: VCF parsing and generation
- `src/models/contactNote/`: Individual contact operations
- `src/models/contactManager/`: Contact collection management
- `src/models/curatorManager/`: Processor coordination
- `src/curators/`: Individual processor implementations
- `src/plugin/services/syncWatcher`: VCF file monitoring
- `src/plugin/services/dropHandler`: VCF file drop handling
- `src/plugin/services/metadataCacheWaiter`: Metadata cache utilities
- `src/plugin/ui/`: UI components (FolderSuggest, modals)

## Implementation Phases

### Phase 1: Core Data Models (Foundation)
**Goal**: Establish foundational classes for contact data handling

#### 1.1 VcardFile Model
**Location**: `src/models/vcardFile/`

**Purpose**: Parse and generate vCard 4.0 files using the vcard4 library

**Components**:
- `vcardFile.ts`: Main VcardFile class
- `parsing.ts`: VCF file parsing (vcard4 integration)
- `generation.ts`: VCF file generation (vcard4 integration)
- `types.ts`: TypeScript interfaces for vCard data
- `index.ts`: Module exports

**Key Responsibilities**:
- Parse VCF files to JavaScript objects
- Generate VCF files from JavaScript objects
- Convert between vCard format and Obsidian frontmatter format
- Handle multiple contacts in single VCF file
- Validate vCard 4.0 compliance

**Dependencies**:
- `vcard4` library (external)
- `yaml` library (external)
- `flat` library (external)

**Specifications Referenced**:
- [vcard-format.md](../specifications/vcard-format.md)
- [library-integration.md](../specifications/library-integration.md)
- [vcf-sync.md](../specifications/vcf-sync.md)

#### 1.2 ContactNote Model
**Location**: `src/models/contactNote/`

**Purpose**: Manage individual contact note operations

**Components**:
- `contactNote.ts`: Main ContactNote class
- `relationships.ts`: Relationship parsing and management
- `frontmatter.ts`: Frontmatter operations
- `markdown.ts`: Markdown content operations
- `types.ts`: TypeScript interfaces
- `index.ts`: Module exports

**Key Responsibilities**:
- Read/write contact note files
- Parse and update frontmatter
- Extract and manage the Related section
- Extract and manage the Contact section
- Handle gender-aware relationship processing
- UID generation and management

**Dependencies**:
- VcardFile model
- `yaml` library
- `marked` library
- Obsidian API (TFile, App)

**Specifications Referenced**:
- [relationship-management.md](../specifications/relationship-management.md)
- [contact-section.md](../specifications/contact-section.md)
- [gender-processing.md](../specifications/gender-processing.md)

### Phase 2: Contact Collection Management

#### 2.1 ContactManager Model
**Location**: `src/models/contactManager/`

**Purpose**: Manage collection of contact notes in the vault

**Components**:
- `contactManager.ts`: Main ContactManager class
- `cache.ts`: Contact caching and indexing
- `relationships.ts`: Bidirectional relationship synchronization
- `operations.ts`: Bulk contact operations
- `types.ts`: TypeScript interfaces
- `index.ts`: Module exports

**Key Responsibilities**:
- Scan vault for contact notes
- Maintain contact cache (UID-based lookup)
- Handle contact file detection
- Manage bidirectional relationship sync
- Coordinate contact data consistency checks
- Event listener management for file changes

**Dependencies**:
- ContactNote model
- Obsidian API (MetadataCache, Vault)
- Shared app context

**Specifications Referenced**:
- [relationship-management.md](../specifications/relationship-management.md)
- [vcf-sync.md](../specifications/vcf-sync.md)

#### 2.2 VcardManager Model
**Location**: `src/models/vcardManager/`

**Purpose**: Manage VCF file collection and write operations

**Components**:
- `vcardManager.ts`: Main VcardManager class
- `writeQueue.ts`: Write queue system for controlled file operations
- `batchProcessing.ts`: Batch VCF operations
- `types.ts`: TypeScript interfaces
- `index.ts`: Module exports

**Key Responsibilities**:
- VCF collection management
- Write queue system to prevent file conflicts
- Batch processing of VCF files
- Handle both single-file and multi-file VCF modes

**Dependencies**:
- VcardFile model
- ContactNote model
- Obsidian API (Vault)

**Specifications Referenced**:
- [vcf-sync.md](../specifications/vcf-sync.md)

### Phase 3: Curator Pipeline System

#### 3.1 CuratorManager Model
**Location**: `src/models/curatorManager/`

**Purpose**: Coordinate processor execution and manage the curator pipeline

**Components**:
- `curatorManager.ts`: Main CuratorManager class with processor registration
- `CuratorProcessor.ts`: Processor interface definition
- `CuratorQueItem.ts`: Queue item type
- `RunType.ts`: Enum for processor run types (IMMEDIATELY, UPCOMING, IMPROVEMENT)
- `CuratorSettingProperties.ts`: Curator settings interface
- `index.ts`: Module exports

**Key Responsibilities**:
- Maintain processor registry
- Manage queue of contacts to process
- Execute processors sequentially (no concurrency)
- Track processor dependencies
- Register curator commands with Obsidian
- Coordinate processor lifecycle

**Dependencies**:
- ContactManager model
- ContactNote model
- Shared settings context
- Obsidian API (Command)

**Specifications Referenced**:
- [curator-pipeline.md](../specifications/curator-pipeline.md)

#### 3.2 Curator Processors
**Location**: `src/curators/`

**Purpose**: Individual processor implementations for contact operations

**Standard Processors**:

1. **uidProcessor.ts**
   - Type: IMMEDIATELY
   - Ensures every contact has a UID
   - Generates UID if missing

2. **relatedFrontMatterProcessor.ts**
   - Type: UPCOMING
   - Syncs relationships from Related list to frontmatter
   - Adds missing relationships to frontmatter

3. **relatedListProcessor.ts**
   - Type: UPCOMING
   - Syncs relationships from frontmatter to Related list
   - Adds missing relationships to Related section

4. **genderInferenceProcessor.ts**
   - Type: UPCOMING
   - Infers gender from relationship terms
   - Updates GENDER field on related contacts

5. **genderRenderProcessor.ts**
   - Type: UPCOMING
   - Renders relationships with gender-specific terms
   - Converts genderless types to gendered display

6. **contactSectionToFrontmatterProcessor.ts**
   - Type: UPCOMING
   - Syncs Contact section to frontmatter
   - Parses contact list items and updates fields

7. **frontmatterToContactSectionProcessor.ts**
   - Type: UPCOMING
   - Syncs frontmatter to Contact section
   - Renders contact fields as markdown list

8. **vcardSyncPreProcessor.ts** and **vcardSyncPostProcessor.ts**
   - Type: UPCOMING
   - VCF synchronization operations
   - Handle pre/post VCF sync tasks

9. **relatedNamespaceUpgradeProcessor.ts**
   - Type: IMPROVEMENT
   - Migrates old relationship formats
   - Upgrades namespace format

**Curator Registration**:
- `src/curatorRegistration.ts`: Central registry for all processors

**Dependencies**:
- CuratorManager model
- ContactNote model
- ContactManager model
- Curator processor interfaces

**Specifications Referenced**:
- [curator-pipeline.md](../specifications/curator-pipeline.md)
- [relationship-management.md](../specifications/relationship-management.md)
- [contact-section.md](../specifications/contact-section.md)
- [gender-processing.md](../specifications/gender-processing.md)

### Phase 4: Plugin Services

#### 4.1 Sync Watcher Service
**Location**: `src/plugin/services/syncWatcher.ts`

**Purpose**: Monitor VCF watch folder for external changes

**Key Responsibilities**:
- File system polling for VCF changes
- Detect new, modified, and deleted VCF files
- Trigger contact note updates
- Respect ignore lists (filenames, UIDs)

**Dependencies**:
- VcardManager model
- ContactManager model
- Settings

**Specifications Referenced**:
- [vcf-sync.md](../specifications/vcf-sync.md)

#### 4.2 Drop Handler Service
**Location**: `src/plugin/services/dropHandler.ts`

**Purpose**: Handle VCF files dropped into vault

**Key Responsibilities**:
- Watch for new .vcf files created in vault
- Import contacts from dropped VCF files
- Move VCF files to watch folder
- Provide user feedback

**Dependencies**:
- VcardManager model
- ContactManager model

**Specifications Referenced**:
- [vcf-sync.md](../specifications/vcf-sync.md)

#### 4.3 Metadata Cache Waiter
**Location**: `src/plugin/services/metadataCacheWaiter.ts`

**Purpose**: Wait for Obsidian metadata cache to be ready

**Key Responsibilities**:
- Ensure metadata cache is populated before initialization
- Prevent race conditions during plugin startup

**Dependencies**:
- Obsidian API (MetadataCache)

#### 4.4 vdirsyncer Service
**Location**: `src/plugin/services/vdirsyncerService.ts`

**Purpose**: Interface with vdirsyncer configuration

**Key Responsibilities**:
- Read/write vdirsyncer config file
- Validate configuration
- Provide config editing interface

**Dependencies**:
- Settings
- File system access

**Specifications Referenced**:
- [vdirsyncer-ui-mockup.md](../specifications/vdirsyncer-ui-mockup.md)

### Phase 5: User Interface Components

#### 5.1 Folder Suggest
**Location**: `src/plugin/ui/FolderSuggest.ts`

**Purpose**: Auto-complete for folder paths in settings

**Dependencies**:
- Obsidian API (AbstractInputSuggest)

#### 5.2 Modals
**Location**: `src/plugin/ui/modals/`

**Components**:
- `vdirsyncerConfigModal.ts`: Edit vdirsyncer configuration

**Dependencies**:
- Obsidian API (Modal)
- vdirsyncer service

### Phase 6: Testing Infrastructure

#### 6.1 Unit Tests
**Location**: `tests/units/`

**Coverage**:
- Model classes (VcardFile, ContactNote, ContactManager, etc.)
- Curator processors
- Services
- Utilities

#### 6.2 Integration Tests
**Location**: `tests/stories/`

**Coverage**:
- End-to-end user story scenarios
- VCF sync workflows
- Relationship management
- Contact section sync

#### 6.3 Test Fixtures
**Location**: `tests/fixtures/`

**Components**:
- Mock Obsidian API
- Sample VCF files
- Test contact notes
- Mock file system

## Implementation Order

### Recommended Sequence

1. **Start with VcardFile model** (Phase 1.1)
   - Foundation for all VCF operations
   - Can be tested independently
   - No Obsidian dependencies

2. **Build ContactNote model** (Phase 1.2)
   - Requires VcardFile
   - Core of contact management
   - Enables relationship and contact section features

3. **Implement ContactManager** (Phase 2.1)
   - Requires ContactNote
   - Enables vault-wide contact operations
   - Needed by curator system

4. **Add VcardManager** (Phase 2.2)
   - Requires VcardFile and ContactNote
   - Enables VCF sync features
   - Relatively independent

5. **Build Curator System** (Phase 3)
   - Requires ContactManager and ContactNote
   - Start with CuratorManager and basic processors
   - Add advanced processors incrementally

6. **Implement Services** (Phase 4)
   - Requires models to be complete
   - Each service can be added independently
   - Start with critical services (metadataCacheWaiter)

7. **Add UI Components** (Phase 5)
   - Final layer
   - Enhance user experience
   - Can be added incrementally

8. **Write Tests Throughout** (Phase 6)
   - Add unit tests as each component is built
   - Integration tests after major features
   - Don't wait until the end

## Success Criteria

### Phase Completion Checkpoints

Each phase is complete when:
1. All components compile without errors
2. Unit tests pass for the phase
3. Integration with previous phases works
4. Documentation is updated
5. Code follows project standards

### Overall Project Success

The implementation is successful when:
1. All specifications are satisfied
2. All user stories can be demonstrated
3. Tests have good coverage (>80%)
4. Plugin loads and runs in Obsidian
5. VCF sync works bidirectionally
6. Relationship management functions correctly
7. Contact section displays and syncs properly
8. No data loss during operations

## Risk Mitigation

### Technical Risks

1. **Library Integration Complexity**
   - Mitigation: Start with simple examples, build incrementally
   - Test library behavior in isolation before integration

2. **Race Conditions in Curator Pipeline**
   - Mitigation: Strict sequential execution
   - Comprehensive tests for concurrent scenarios

3. **Data Loss During Sync**
   - Mitigation: Always read-modify-write, never destructive operations
   - Extensive testing with real-world data

4. **Performance with Large Contact Lists**
   - Mitigation: Implement caching early
   - Profile and optimize critical paths
   - Use efficient data structures

### Project Risks

1. **Scope Creep**
   - Mitigation: Stick to phased approach
   - Implement specifications exactly, no additions mid-stream

2. **Integration Issues**
   - Mitigation: Test integration points early
   - Use dependency injection for flexibility

## Next Steps

1. Review this plan with stakeholders
2. Set up development environment
3. Begin Phase 1.1 (VcardFile model)
4. Establish testing patterns early
5. Document as you build

## References

- [Project README](../README.md)
- [Specifications](../specifications/README.md)
- [User Stories](../user-stories.md)
- [Obsidian API Reference](../references/obsidian/)
- [vCard Reference](../references/vcard/)
