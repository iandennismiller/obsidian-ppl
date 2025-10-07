# Implementation Task Breakdown

## Overview

This document provides a detailed task breakdown for implementing the Obsidian VCF Contacts Plugin. Each task is actionable and can be completed independently or with minimal dependencies.

## Phase 1: Core Data Models

### Phase 1.1: VcardFile Model

**Estimated Effort**: 2-3 days

#### Tasks

- [ ] **1.1.1 Setup module structure**
  - Create `src/models/vcardFile/` directory
  - Create placeholder files: `vcardFile.ts`, `parsing.ts`, `generation.ts`, `types.ts`, `index.ts`
  - Setup exports in `index.ts`

- [ ] **1.1.2 Define TypeScript interfaces** (`types.ts`)
  - Define `VCardData` interface
  - Define `VCardField` interface
  - Define helper types for field mappings
  - Export all types

- [ ] **1.1.3 Implement VCF parsing** (`parsing.ts`)
  - `parseVcfFile()`: Parse multi-contact VCF string
  - `parseVcfContact()`: Parse single vCard
  - `vcardToFrontmatter()`: Convert vCard4 object to flat frontmatter
  - `flattenVCardData()`: Use flat library to flatten nested data
  - Handle edge cases (missing fields, invalid format)

- [ ] **1.1.4 Implement VCF generation** (`generation.ts`)
  - `generateVcfFile()`: Generate multi-contact VCF string
  - `generateVcfContact()`: Generate single vCard
  - `frontmatterToVcard()`: Convert frontmatter to vCard4 object
  - `unflattenFrontmatter()`: Use flat library to unflatten data
  - Ensure deterministic field ordering

- [ ] **1.1.5 Implement VcardFile class** (`vcardFile.ts`)
  - Constructor and properties
  - Static factory methods (`fromFile`, `fromString`, `empty`)
  - Contact management methods (`addContact`, `removeContact`, `getContact`)
  - Serialization methods (`toVCardString`, `save`)

- [ ] **1.1.6 Write unit tests**
  - Test parsing valid VCF files
  - Test parsing invalid VCF files (error handling)
  - Test generating VCF files
  - Test frontmatter <-> vCard conversion
  - Test field ordering consistency
  - Test multi-contact files

- [ ] **1.1.7 Integration testing**
  - Test with real VCF files from demo data
  - Test round-trip (parse -> generate -> parse)
  - Verify vCard 4.0 compliance

**Deliverables**:
- Working VcardFile model with full VCF parsing/generation
- Comprehensive unit tests
- Documentation (JSDoc comments)

---

### Phase 1.2: ContactNote Model

**Estimated Effort**: 4-5 days

#### Tasks

- [ ] **1.2.1 Setup module structure**
  - Create `src/models/contactNote/` directory
  - Create files: `contactNote.ts`, `relationships.ts`, `frontmatter.ts`, `markdown.ts`, `types.ts`, `index.ts`
  - Setup exports

- [ ] **1.2.2 Define TypeScript interfaces** (`types.ts`)
  - Define `Relationship` interface
  - Define `ContactSectionData` interface
  - Define `ContactField` interface
  - Define `Heading` interface
  - Export all types

- [ ] **1.2.3 Implement frontmatter operations** (`frontmatter.ts`)
  - `parseFrontmatter()`: Extract frontmatter from markdown
  - `generateFrontmatter()`: Create YAML frontmatter string
  - `updateFrontmatter()`: Update frontmatter in file content
  - `validateFrontmatter()`: Validate frontmatter structure
  - `removeInvalidFields()`: Clean up invalid fields
  - Use yaml library for parsing/generation

- [ ] **1.2.4 Implement relationship operations** (`relationships.ts`)
  - `parseRelatedSection()`: Extract relationships from markdown
  - `generateRelatedSection()`: Create Related section markdown
  - `parseRelatedFrontmatter()`: Extract from RELATED fields
  - `generateRelatedFrontmatter()`: Create RELATED fields
  - `normalizeRelationshipType()`: Convert to genderless type
  - `getGenderedRelationshipType()`: Convert to gendered display
  - `inferGenderFromType()`: Detect gender from relationship term
  - `findRelatedHeading()`: Locate ## Related in markdown
  - Use marked library for markdown parsing

- [ ] **1.2.5 Implement markdown operations** (`markdown.ts`)
  - `parseContactSection()`: Extract contact info from markdown
  - `generateContactSection()`: Create Contact section markdown
  - `extractHeadings()`: Find all headings in markdown
  - `findSectionByHeading()`: Get content under a heading
  - `replaceSectionByHeading()`: Replace section content
  - `ensureSectionOrder()`: Ensure Contact before Related
  - Implement field type detection (email, phone, URL, address)
  - Use marked library for parsing

- [ ] **1.2.6 Implement ContactNote class** (`contactNote.ts`)
  - Constructor and properties
  - Static factory methods (`fromFile`, `create`)
  - Frontmatter methods (`getFrontmatter`, `setFrontmatter`, `updateFrontmatterField`)
  - UID methods (`getUID`, `setUID`, `ensureUID`)
  - Relationship methods (`getRelationships`, `addRelationship`, `removeRelationship`)
  - Contact section methods (`getContactSection`, `updateContactSection`)
  - Gender methods (`getGender`, `setGender`, `inferGenderFromRelationships`)
  - Revision methods (`updateREV`, `getREV`)

- [ ] **1.2.7 Write unit tests**
  - Test frontmatter parsing/generation
  - Test relationship parsing/syncing
  - Test Contact section parsing/generation
  - Test gender inference and rendering
  - Test UID generation
  - Test REV field updates
  - Test section ordering

- [ ] **1.2.8 Integration testing**
  - Test with real contact notes
  - Test bidirectional sync (frontmatter <-> markdown)
  - Test edge cases (missing sections, malformed data)

**Deliverables**:
- Working ContactNote model with full functionality
- Comprehensive unit tests
- Documentation

---

## Phase 2: Contact Collection Management

### Phase 2.1: ContactManager Model

**Estimated Effort**: 3-4 days

#### Tasks

- [ ] **2.1.1 Setup module structure**
  - Create `src/models/contactManager/` directory
  - Create files: `contactManager.ts`, `cache.ts`, `relationships.ts`, `operations.ts`, `types.ts`, `index.ts`

- [ ] **2.1.2 Define interfaces** (`types.ts`)
  - Define cache structures
  - Define validation result types
  - Export types

- [ ] **2.1.3 Implement cache operations** (`cache.ts`)
  - `buildContactCache()`: Scan vault and build cache
  - `updateCacheEntry()`: Update single cache entry
  - `removeCacheEntry()`: Remove from cache
  - `findContactFiles()`: Find all contact files in folder

- [ ] **2.1.4 Implement relationship sync** (`relationships.ts`)
  - `syncBidirectionalRelationships()`: Sync source contact's relationships
  - `ensureReverseRelationship()`: Create reverse relationship on target
  - `getReverseRelationshipType()`: Get reverse type (e.g., parent -> child)
  - `validateRelationshipGraph()`: Check for broken relationships

- [ ] **2.1.5 Implement ContactManager class** (`contactManager.ts`)
  - Constructor and initialization
  - Cache management methods
  - Contact CRUD operations
  - Relationship sync methods
  - Event listener setup/cleanup
  - Event handlers (onCreate, onModify, onDelete, onRename)

- [ ] **2.1.6 Write unit tests**
  - Test cache building
  - Test cache updates
  - Test relationship synchronization
  - Test event handling
  - Test contact lookup by UID and path

- [ ] **2.1.7 Integration testing**
  - Test with mock vault
  - Test relationship graph consistency
  - Test concurrent file operations

**Deliverables**:
- Working ContactManager with caching and relationship sync
- Unit and integration tests
- Documentation

---

### Phase 2.2: VcardManager Model

**Estimated Effort**: 2-3 days

#### Tasks

- [ ] **2.2.1 Setup module structure**
  - Create `src/models/vcardManager/` directory
  - Create files: `vcardManager.ts`, `writeQueue.ts`, `batchProcessing.ts`, `types.ts`, `index.ts`

- [ ] **2.2.2 Implement write queue** (`writeQueue.ts`)
  - Define `WriteOperation` interface
  - Implement `WriteQueue` class
  - Queue management (enqueue, process, clear)
  - Prevent concurrent writes to same file

- [ ] **2.2.3 Implement batch processing** (`batchProcessing.ts`)
  - `batchExport()`: Export multiple contacts
  - `batchImport()`: Import multiple VCF files
  - Progress tracking

- [ ] **2.2.4 Implement VcardManager class** (`vcardManager.ts`)
  - Constructor and initialization
  - VCF file operations (load, save)
  - Contact sync methods (toVcf, fromVcf)
  - Single vs. multi-file mode handling
  - Path generation for VCF files

- [ ] **2.2.5 Write unit tests**
  - Test write queue sequencing
  - Test batch operations
  - Test single-file mode
  - Test multi-file mode
  - Test VCF sync

- [ ] **2.2.6 Integration testing**
  - Test with ContactManager
  - Test concurrent sync operations
  - Test file system errors

**Deliverables**:
- Working VcardManager with write queue
- Unit and integration tests
- Documentation

---

## Phase 3: Curator Pipeline System

### Phase 3.1: CuratorManager Model

**Estimated Effort**: 2-3 days

#### Tasks

- [ ] **3.1.1 Setup module structure**
  - Create `src/models/curatorManager/` directory
  - Create files: `curatorManager.ts`, `CuratorProcessor.ts`, `CuratorQueItem.ts`, `RunType.ts`, `CuratorSettingProperties.ts`, `index.ts`

- [ ] **3.1.2 Define core types**
  - Define `CuratorProcessor` interface
  - Define `RunType` enum
  - Define `CuratorQueItem` interface
  - Define `CuratorSettingProperties` interface

- [ ] **3.1.3 Implement CuratorManager class**
  - Processor registration
  - Queue management
  - Sequential processor execution
  - Command registration with Obsidian
  - Settings management

- [ ] **3.1.4 Create curator registration** (`src/curatorRegistration.ts`)
  - Central processor registry
  - Import and register all processors

- [ ] **3.1.5 Write unit tests**
  - Test processor registration
  - Test queue management
  - Test sequential execution
  - Test processor dependencies

**Deliverables**:
- Working CuratorManager infrastructure
- Unit tests
- Documentation

---

### Phase 3.2: Curator Processors

**Estimated Effort**: 5-7 days (all processors)

#### Tasks

- [ ] **3.2.1 Implement uidProcessor**
  - Check for missing UID
  - Generate UUID if missing
  - Update frontmatter
  - Write tests

- [ ] **3.2.2 Implement relatedFrontMatterProcessor**
  - Parse Related section
  - Compare with frontmatter
  - Add missing relationships to frontmatter
  - Write tests

- [ ] **3.2.3 Implement relatedListProcessor**
  - Parse RELATED frontmatter
  - Compare with Related section
  - Add missing relationships to section
  - Write tests

- [ ] **3.2.4 Implement genderInferenceProcessor**
  - Detect gendered relationship terms
  - Infer gender from terms
  - Update related contact's GENDER field
  - Update REV field
  - Write tests

- [ ] **3.2.5 Implement genderRenderProcessor**
  - Get contact's gender
  - Convert genderless types to gendered display
  - Update Related section display
  - Write tests

- [ ] **3.2.6 Implement contactSectionToFrontmatterProcessor**
  - Parse Contact section
  - Detect field types (email, phone, URL, address)
  - Update frontmatter fields
  - Write tests

- [ ] **3.2.7 Implement frontmatterToContactSectionProcessor**
  - Extract contact fields from frontmatter
  - Generate Contact section markdown
  - Ensure proper field ordering
  - Write tests

- [ ] **3.2.8 Implement vcardSyncPreProcessor**
  - Pre-sync validation
  - Prepare data for VCF sync
  - Write tests

- [ ] **3.2.9 Implement vcardSyncPostProcessor**
  - Post-sync cleanup
  - Update REV fields
  - Write tests

- [ ] **3.2.10 Implement relatedNamespaceUpgradeProcessor**
  - Detect old namespace formats
  - Upgrade to new format
  - Write tests

- [ ] **3.2.11 Integration testing**
  - Test processor pipeline
  - Test with real contact data
  - Test dependency chains
  - Test data preservation

**Deliverables**:
- All standard curator processors
- Comprehensive unit tests
- Integration tests for pipeline
- Documentation

---

## Phase 4: Plugin Services

### Phase 4.1: Sync Watcher Service

**Estimated Effort**: 2 days

#### Tasks

- [ ] **4.1.1 Implement SyncWatcher class** (`src/plugin/services/syncWatcher.ts`)
  - Polling-based file monitoring
  - Detect file changes (mtime comparison)
  - Handle new, modified, deleted files
  - Respect ignore lists
  - Debounce rapid changes

- [ ] **4.1.2 Write tests**
  - Test file change detection
  - Test ignore list functionality
  - Test polling interval

**Deliverables**:
- Working SyncWatcher service
- Tests
- Documentation

---

### Phase 4.2: Drop Handler Service

**Estimated Effort**: 1 day

#### Tasks

- [ ] **4.2.1 Implement drop handler** (`src/plugin/services/dropHandler.ts`)
  - Watch for .vcf file creation
  - Import contacts from dropped VCF
  - Move VCF to watch folder
  - Show user notifications

- [ ] **4.2.2 Write tests**
  - Test VCF file detection
  - Test import workflow

**Deliverables**:
- Working drop handler
- Tests
- Documentation

---

### Phase 4.3: Metadata Cache Waiter

**Estimated Effort**: 0.5 days

#### Tasks

- [ ] **4.3.1 Implement waiter function** (`src/plugin/services/metadataCacheWaiter.ts`)
  - Check if metadata cache is ready
  - Wait with timeout if not ready
  - Return when cache is populated

- [ ] **4.3.2 Write tests**
  - Test with mock metadata cache

**Deliverables**:
- Working metadata cache waiter
- Tests

---

### Phase 4.4: vdirsyncer Service

**Estimated Effort**: 1-2 days

#### Tasks

- [ ] **4.4.1 Implement vdirsyncer functions** (`src/plugin/services/vdirsyncerService.ts`)
  - Read vdirsyncer config file
  - Write vdirsyncer config file
  - Validate config format
  - Get default config path

- [ ] **4.4.2 Write tests**
  - Test config read/write
  - Test validation

**Deliverables**:
- Working vdirsyncer service
- Tests
- Documentation

---

## Phase 5: User Interface Components

### Phase 5.1: Folder Suggest

**Estimated Effort**: 1 day

#### Tasks

- [ ] **5.1.1 Implement FolderSuggest class** (`src/plugin/ui/FolderSuggest.ts`)
  - Extend AbstractInputSuggest
  - Get folder suggestions from vault
  - Render suggestions
  - Handle selection

- [ ] **5.1.2 Write tests**
  - Test suggestion generation
  - Test filtering

**Deliverables**:
- Working FolderSuggest component
- Tests

---

### Phase 5.2: Modals

**Estimated Effort**: 1-2 days

#### Tasks

- [ ] **5.2.1 Implement vdirsyncerConfigModal** (`src/plugin/ui/modals/vdirsyncerConfigModal.ts`)
  - Extend Modal
  - Load config content
  - Provide editing interface
  - Save config
  - Validation

- [ ] **5.2.2 Write tests**
  - Test modal opening
  - Test save functionality

**Deliverables**:
- Working vdirsyncer config modal
- Tests

---

## Phase 6: Testing Infrastructure

### Phase 6.1: Test Setup

**Estimated Effort**: Ongoing

#### Tasks

- [ ] **6.1.1 Setup Vitest configuration**
  - Already exists in `vitest.config.ts`
  - Verify coverage settings

- [ ] **6.1.2 Create test fixtures**
  - Mock Obsidian API (expand `tests/fixtures/emptyObsidianMock.ts`)
  - Sample VCF files
  - Sample contact notes
  - Mock file system utilities

- [ ] **6.1.3 Organize test structure**
  - Mirror `/src` in `/tests/units`
  - Create `/tests/stories` for integration tests
  - Create `/tests/fixtures` for test data

---

### Phase 6.2: Integration Tests

**Estimated Effort**: 2-3 days

#### Tasks

- [ ] **6.2.1 VCF sync story tests**
  - Test full import/export workflow
  - Test bidirectional sync
  - Test conflict resolution

- [ ] **6.2.2 Relationship management story tests**
  - Test bidirectional relationship sync
  - Test gender-aware processing
  - Test relationship graph validation

- [ ] **6.2.3 Contact section story tests**
  - Test bidirectional Contact section sync
  - Test field type detection
  - Test section ordering

- [ ] **6.2.4 Curator pipeline story tests**
  - Test full processor pipeline
  - Test processor dependencies
  - Test data preservation

**Deliverables**:
- Comprehensive integration test suite
- High code coverage (>80%)
- Documentation

---

## Verification and Validation

### Final Testing

#### Tasks

- [ ] **Test in Obsidian**
  - Load plugin in actual Obsidian vault
  - Test all user stories manually
  - Test with large contact database
  - Test performance

- [ ] **Code Quality**
  - Run linter (npm run compile)
  - Fix all warnings
  - Ensure consistent code style
  - Add missing JSDoc comments

- [ ] **Documentation**
  - Update README if needed
  - Verify all specifications are met
  - Update development docs

- [ ] **Performance Testing**
  - Profile with large datasets
  - Optimize critical paths
  - Test memory usage

---

## Timeline Estimates

### Total Estimated Effort

- **Phase 1**: 6-8 days (VcardFile + ContactNote)
- **Phase 2**: 5-7 days (ContactManager + VcardManager)
- **Phase 3**: 7-10 days (CuratorManager + all processors)
- **Phase 4**: 4-6 days (All services)
- **Phase 5**: 2-3 days (UI components)
- **Phase 6**: 2-3 days (Additional integration testing)
- **Verification**: 2-3 days (Final testing and polish)

**Total**: 28-40 days of focused development

### Suggested Sprints (2-week iterations)

**Sprint 1** (Weeks 1-2):
- Complete Phase 1 (VcardFile + ContactNote)
- Begin Phase 2 (ContactManager)

**Sprint 2** (Weeks 3-4):
- Complete Phase 2 (VcardManager)
- Begin Phase 3 (CuratorManager)

**Sprint 3** (Weeks 5-6):
- Complete Phase 3 (all processors)
- Begin Phase 4 (services)

**Sprint 4** (Weeks 7-8):
- Complete Phase 4 (services)
- Complete Phase 5 (UI)
- Begin verification

**Sprint 5** (Weeks 9-10):
- Complete Phase 6 (integration tests)
- Final verification and polish
- Documentation updates

---

## Risk Management

### High-Risk Items

1. **Relationship synchronization complexity**
   - Mitigation: Extensive testing, clear specifications
   - Start simple, add complexity incrementally

2. **Data loss during sync**
   - Mitigation: Always read-modify-write pattern
   - Never destructive operations
   - Comprehensive tests

3. **Performance with large datasets**
   - Mitigation: Profile early, optimize incrementally
   - Use caching aggressively
   - Test with realistic data sizes

4. **Race conditions in curator pipeline**
   - Mitigation: Strict sequential execution
   - Test concurrent scenarios
   - Clear queue management

### Medium-Risk Items

1. **Library integration issues**
   - Mitigation: Test libraries in isolation first
   - Stay within documented API

2. **Obsidian API changes**
   - Mitigation: Use stable API features
   - Test with multiple Obsidian versions

---

## Success Metrics

### Code Quality

- [ ] All TypeScript compilation passes
- [ ] Test coverage > 80%
- [ ] No critical bugs
- [ ] All specifications satisfied

### Functionality

- [ ] All user stories demonstrable
- [ ] VCF sync works bidirectionally
- [ ] Relationship sync maintains consistency
- [ ] Contact section displays correctly
- [ ] No data loss in any scenario

### Performance

- [ ] Plugin loads in < 5 seconds
- [ ] Handles 1000+ contacts efficiently
- [ ] No UI blocking during operations
- [ ] Memory usage reasonable

---

## Next Steps

1. **Review this breakdown** with stakeholders
2. **Set up development environment**
3. **Begin Phase 1.1** (VcardFile model)
4. **Establish testing patterns** early
5. **Regular progress updates** after each major task

## References

- [Implementation Roadmap](implementation-roadmap.md)
- [Class Structure](class-structure.md)
- [Specifications](../specifications/README.md)
- [User Stories](../user-stories.md)
