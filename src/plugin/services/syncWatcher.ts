/**
 * SyncWatcher Service
 * 
 * Monitors VCF watch folder for external changes and triggers sync operations.
 * Uses polling-based monitoring with configurable interval.
 */

import { App, TFile, TFolder, Notice } from 'obsidian';
import { ContactsPluginSettings } from '../settings';
import * as fs from 'fs';
import * as path from 'path';

export interface FileChange {
  path: string;
  type: 'created' | 'modified' | 'deleted';
  timestamp: number;
}

export class SyncWatcher {
  private app: App;
  private settings: ContactsPluginSettings;
  private pollingInterval: number;
  private intervalId?: NodeJS.Timeout;
  private lastChecked: Map<string, number>; // file path -> mtime timestamp
  private isRunning: boolean;
  private onChangeCallback?: (changes: FileChange[]) => Promise<void>;

  constructor(app: App, settings: ContactsPluginSettings) {
    this.app = app;
    this.settings = settings;
    this.pollingInterval = Math.max(settings.vcardWatchPollingInterval * 1000, 10000); // Minimum 10 seconds
    this.lastChecked = new Map();
    this.isRunning = false;
  }

  /**
   * Start watching for file changes
   */
  async start(onChangeCallback?: (changes: FileChange[]) => Promise<void>): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.onChangeCallback = onChangeCallback;
    this.isRunning = true;

    // Initial scan to populate lastChecked
    await this.scanFolder(true);

    // Start polling
    this.intervalId = setInterval(async () => {
      await this.checkForChanges();
    }, this.pollingInterval);
  }

  /**
   * Stop watching for file changes
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
  }

  /**
   * Check for changes in the watch folder
   */
  async checkForChanges(): Promise<FileChange[]> {
    if (!this.settings.vcardWatchEnabled || !this.settings.vcardWatchFolder) {
      return [];
    }

    const changes: FileChange[] = [];
    const currentFiles = new Set<string>();

    try {
      const files = await this.scanFolder(false);
      
      for (const file of files) {
        currentFiles.add(file.path);
        
        if (this.shouldIgnoreFile(file.path)) {
          continue;
        }

        const lastMtime = this.lastChecked.get(file.path);
        
        if (lastMtime === undefined) {
          // New file
          changes.push({
            path: file.path,
            type: 'created',
            timestamp: file.mtime
          });
        } else if (file.mtime > lastMtime) {
          // Modified file
          changes.push({
            path: file.path,
            type: 'modified',
            timestamp: file.mtime
          });
        }

        this.lastChecked.set(file.path, file.mtime);
      }

      // Check for deleted files
      for (const [filePath, _] of this.lastChecked) {
        if (!currentFiles.has(filePath) && !this.shouldIgnoreFile(filePath)) {
          changes.push({
            path: filePath,
            type: 'deleted',
            timestamp: Date.now()
          });
          this.lastChecked.delete(filePath);
        }
      }

      // Trigger callback if there are changes
      if (changes.length > 0 && this.onChangeCallback) {
        await this.onChangeCallback(changes);
      }

      return changes;
    } catch (error) {
      console.error('Error checking for VCF file changes:', error);
      return [];
    }
  }

  /**
   * Scan watch folder for VCF files
   */
  private async scanFolder(isInitial: boolean): Promise<Array<{path: string, mtime: number}>> {
    const watchFolder = this.settings.vcardWatchFolder;
    
    if (!watchFolder) {
      return [];
    }

    const files: Array<{path: string, mtime: number}> = [];

    try {
      // Use Node.js fs to scan the folder (outside vault)
      const entries = fs.readdirSync(watchFolder, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.vcf')) {
          const filePath = path.join(watchFolder, entry.name);
          const stats = fs.statSync(filePath);
          
          files.push({
            path: filePath,
            mtime: stats.mtimeMs
          });

          if (isInitial) {
            this.lastChecked.set(filePath, stats.mtimeMs);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning folder ${watchFolder}:`, error);
    }

    return files;
  }

  /**
   * Check if file should be ignored based on settings
   */
  private shouldIgnoreFile(filePath: string, uid?: string): boolean {
    const filename = path.basename(filePath);

    // Check filename ignore list
    if (this.settings.vcardCustomizeIgnoreList && 
        this.settings.vcardIgnoreFilenames.includes(filename)) {
      return true;
    }

    // Check UID ignore list (if UID is provided)
    if (uid && this.settings.vcardCustomizeIgnoreList && 
        this.settings.vcardIgnoreUIDs.includes(uid)) {
      return true;
    }

    return false;
  }

  /**
   * Get current status
   */
  getStatus(): {
    isRunning: boolean;
    filesTracked: number;
    pollingInterval: number;
  } {
    return {
      isRunning: this.isRunning,
      filesTracked: this.lastChecked.size,
      pollingInterval: this.pollingInterval
    };
  }

  /**
   * Update settings and restart if necessary
   */
  updateSettings(settings: ContactsPluginSettings): void {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.stop();
    }

    this.settings = settings;
    this.pollingInterval = Math.max(settings.vcardWatchPollingInterval * 1000, 10000);

    if (wasRunning && settings.vcardWatchEnabled) {
      this.start(this.onChangeCallback);
    }
  }
}
