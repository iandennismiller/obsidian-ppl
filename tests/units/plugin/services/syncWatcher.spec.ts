import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncWatcher } from '../../../../src/plugin/services/syncWatcher';
import { ContactsPluginSettings } from '../../../../src/plugin/settings';
import * as fs from 'fs';
import * as path from 'path';

// Mock Obsidian App
const mockApp = {} as any;

// Mock settings
const createMockSettings = (overrides?: Partial<ContactsPluginSettings>): ContactsPluginSettings => ({
  contactsFolder: 'Contacts',
  defaultHashtag: '#contact',
  vcardStorageMethod: 'vcard-folder',
  vcardFilename: 'contacts.vcf',
  vcardWatchFolder: '/tmp/test-vcf',
  vcardWatchEnabled: true,
  vcardWatchPollingInterval: 30,
  vcardWriteBackEnabled: true,
  vcardCustomizeIgnoreList: false,
  vcardIgnoreFilenames: [],
  vcardIgnoreUIDs: [],
  contactSectionSyncConfirmation: true,
  removeInvalidFieldsConfirmation: true,
  vdirsyncerCustomFilename: false,
  vdirsyncerConfigPath: '$HOME/.config/vdirsyncer/config',
  ...overrides
});

describe('SyncWatcher', () => {
  let syncWatcher: SyncWatcher;
  let mockSettings: ContactsPluginSettings;
  let testFolder: string;

  beforeEach(() => {
    // Create test folder
    testFolder = `/tmp/test-sync-watcher-${Date.now()}`;
    if (!fs.existsSync(testFolder)) {
      fs.mkdirSync(testFolder, { recursive: true });
    }

    mockSettings = createMockSettings({ vcardWatchFolder: testFolder });
    syncWatcher = new SyncWatcher(mockApp, mockSettings);
  });

  afterEach(async () => {
    // Cleanup
    if (syncWatcher) {
      syncWatcher.stop();
    }

    // Remove test folder
    if (fs.existsSync(testFolder)) {
      fs.rmSync(testFolder, { recursive: true, force: true });
    }
  });

  describe('Construction', () => {
    it('should create SyncWatcher instance', () => {
      expect(syncWatcher).toBeDefined();
    });

    it('should initialize with correct polling interval', () => {
      const status = syncWatcher.getStatus();
      expect(status.pollingInterval).toBe(30000); // 30 seconds in ms
    });

    it('should enforce minimum polling interval of 10 seconds', () => {
      const settings = createMockSettings({ 
        vcardWatchFolder: testFolder,
        vcardWatchPollingInterval: 5 
      });
      const watcher = new SyncWatcher(mockApp, settings);
      const status = watcher.getStatus();
      expect(status.pollingInterval).toBe(10000); // Minimum 10 seconds
    });
  });

  describe('Start and Stop', () => {
    it('should start watching', async () => {
      await syncWatcher.start();
      const status = syncWatcher.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should stop watching', async () => {
      await syncWatcher.start();
      syncWatcher.stop();
      const status = syncWatcher.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it('should not start multiple times', async () => {
      await syncWatcher.start();
      await syncWatcher.start();
      const status = syncWatcher.getStatus();
      expect(status.isRunning).toBe(true);
    });
  });

  describe('File Change Detection', () => {
    it('should detect new VCF file', async () => {
      await syncWatcher.start();
      
      // Create a VCF file
      const testFile = path.join(testFolder, 'test.vcf');
      fs.writeFileSync(testFile, 'BEGIN:VCARD\r\nVERSION:4.0\r\nEND:VCARD\r\n');
      
      // Wait a bit and check for changes
      await new Promise(resolve => setTimeout(resolve, 100));
      const changes = await syncWatcher.checkForChanges();
      
      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('created');
      expect(changes[0].path).toBe(testFile);
    });

    it('should detect modified VCF file', async () => {
      // Create initial file
      const testFile = path.join(testFolder, 'test.vcf');
      fs.writeFileSync(testFile, 'BEGIN:VCARD\r\nVERSION:4.0\r\nEND:VCARD\r\n');
      
      await syncWatcher.start();
      
      // Wait to ensure initial scan completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Modify the file
      await new Promise(resolve => setTimeout(resolve, 100));
      fs.writeFileSync(testFile, 'BEGIN:VCARD\r\nVERSION:4.0\r\nFN:Test\r\nEND:VCARD\r\n');
      
      // Check for changes
      await new Promise(resolve => setTimeout(resolve, 100));
      const changes = await syncWatcher.checkForChanges();
      
      expect(changes.length).toBeGreaterThan(0);
      const modifiedChange = changes.find(c => c.type === 'modified');
      expect(modifiedChange).toBeDefined();
    });

    it('should detect deleted VCF file', async () => {
      // Create initial file
      const testFile = path.join(testFolder, 'test.vcf');
      fs.writeFileSync(testFile, 'BEGIN:VCARD\r\nVERSION:4.0\r\nEND:VCARD\r\n');
      
      await syncWatcher.start();
      
      // Wait to ensure initial scan completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Delete the file
      fs.unlinkSync(testFile);
      
      // Check for changes
      const changes = await syncWatcher.checkForChanges();
      
      const deletedChange = changes.find(c => c.type === 'deleted');
      expect(deletedChange).toBeDefined();
    });

    it('should ignore non-VCF files', async () => {
      await syncWatcher.start();
      
      // Create a non-VCF file
      const testFile = path.join(testFolder, 'test.txt');
      fs.writeFileSync(testFile, 'Not a VCF file');
      
      // Check for changes
      await new Promise(resolve => setTimeout(resolve, 100));
      const changes = await syncWatcher.checkForChanges();
      
      // Should not detect the .txt file
      expect(changes).toHaveLength(0);
    });
  });

  describe('Ignore Lists', () => {
    it('should ignore files in ignore list', async () => {
      const settings = createMockSettings({
        vcardWatchFolder: testFolder,
        vcardCustomizeIgnoreList: true,
        vcardIgnoreFilenames: ['ignored.vcf']
      });
      const watcher = new SyncWatcher(mockApp, settings);
      
      await watcher.start();
      
      // Create ignored file
      const ignoredFile = path.join(testFolder, 'ignored.vcf');
      fs.writeFileSync(ignoredFile, 'BEGIN:VCARD\r\nVERSION:4.0\r\nEND:VCARD\r\n');
      
      // Create non-ignored file
      const normalFile = path.join(testFolder, 'normal.vcf');
      fs.writeFileSync(normalFile, 'BEGIN:VCARD\r\nVERSION:4.0\r\nEND:VCARD\r\n');
      
      // Check for changes
      await new Promise(resolve => setTimeout(resolve, 100));
      const changes = await watcher.checkForChanges();
      
      // Should only detect normal file
      expect(changes).toHaveLength(1);
      expect(changes[0].path).toBe(normalFile);
      
      watcher.stop();
    });
  });

  describe('Change Callback', () => {
    it('should trigger callback on changes', async () => {
      let callbackCalled = false;
      let receivedChanges: any[] = [];
      
      const callback = async (changes: any[]) => {
        callbackCalled = true;
        receivedChanges = changes;
      };
      
      await syncWatcher.start(callback);
      
      // Create a VCF file
      const testFile = path.join(testFolder, 'callback-test.vcf');
      fs.writeFileSync(testFile, 'BEGIN:VCARD\r\nVERSION:4.0\r\nEND:VCARD\r\n');
      
      // Check for changes
      await new Promise(resolve => setTimeout(resolve, 100));
      await syncWatcher.checkForChanges();
      
      expect(callbackCalled).toBe(true);
      expect(receivedChanges.length).toBeGreaterThan(0);
    });
  });

  describe('Status and Settings', () => {
    it('should report correct status', () => {
      const status = syncWatcher.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.filesTracked).toBe(0);
      expect(status.pollingInterval).toBeGreaterThan(0);
    });

    it('should update settings', async () => {
      await syncWatcher.start();
      
      const newSettings = createMockSettings({
        vcardWatchFolder: testFolder,
        vcardWatchPollingInterval: 60
      });
      
      syncWatcher.updateSettings(newSettings);
      
      const status = syncWatcher.getStatus();
      expect(status.pollingInterval).toBe(60000); // 60 seconds in ms
    });

    it('should restart when settings updated while running', async () => {
      await syncWatcher.start();
      expect(syncWatcher.getStatus().isRunning).toBe(true);
      
      const newSettings = createMockSettings({
        vcardWatchFolder: testFolder,
        vcardWatchPollingInterval: 60
      });
      
      syncWatcher.updateSettings(newSettings);
      
      // Should still be running after update
      expect(syncWatcher.getStatus().isRunning).toBe(true);
    });
  });

  describe('Return Empty Changes', () => {
    it('should return empty array when watch disabled', async () => {
      const settings = createMockSettings({
        vcardWatchFolder: testFolder,
        vcardWatchEnabled: false
      });
      const watcher = new SyncWatcher(mockApp, settings);
      
      const changes = await watcher.checkForChanges();
      expect(changes).toHaveLength(0);
    });

    it('should return empty array when folder not configured', async () => {
      const settings = createMockSettings({
        vcardWatchFolder: ''
      });
      const watcher = new SyncWatcher(mockApp, settings);
      
      const changes = await watcher.checkForChanges();
      expect(changes).toHaveLength(0);
    });
  });
});
