/**
 * vdirsyncer Service
 * 
 * Utilities for reading, writing, and validating vdirsyncer configuration files.
 * vdirsyncer is a command-line tool that syncs vCard files with CardDAV servers.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class VdirsyncerService {
  /**
   * Read vdirsyncer config file
   * 
   * @param configPath Path to config file (supports $HOME expansion)
   * @returns Config file content as string
   */
  static async readVdirsyncerConfig(configPath: string): Promise<string> {
    const expandedPath = this.expandPath(configPath);
    
    try {
      const content = fs.readFileSync(expandedPath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read vdirsyncer config: ${error.message}`);
    }
  }

  /**
   * Write vdirsyncer config file
   * 
   * @param configPath Path to config file (supports $HOME expansion)
   * @param content Config file content
   */
  static async writeVdirsyncerConfig(configPath: string, content: string): Promise<void> {
    const expandedPath = this.expandPath(configPath);
    
    try {
      // Ensure directory exists
      const dir = path.dirname(expandedPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(expandedPath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write vdirsyncer config: ${error.message}`);
    }
  }

  /**
   * Validate vdirsyncer config content
   * 
   * Performs basic validation of vdirsyncer configuration format.
   * Note: This is not a complete vdirsyncer config validator, just basic checks.
   * 
   * @param content Config file content
   * @returns Validation result with errors and warnings
   */
  static validateVdirsyncerConfig(content: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check if content is empty
    if (!content || content.trim().length === 0) {
      result.isValid = false;
      result.errors.push('Config file is empty');
      return result;
    }

    // Check for required sections
    const hasGeneralSection = content.includes('[general]');
    const hasPairSection = /\[pair\s+\w+\]/.test(content);
    const hasStorageSection = /\[storage\s+\w+\]/.test(content);

    if (!hasGeneralSection) {
      result.warnings.push('Missing [general] section');
    }

    if (!hasPairSection) {
      result.warnings.push('No [pair] sections found');
    }

    if (!hasStorageSection) {
      result.warnings.push('No [storage] sections found');
    }

    // Check for common syntax errors
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip comments and empty lines
      if (line.startsWith('#') || line.startsWith(';') || line.length === 0) {
        continue;
      }

      // Check for invalid section headers
      if (line.startsWith('[')) {
        if (!line.endsWith(']')) {
          result.isValid = false;
          result.errors.push(`Line ${i + 1}: Invalid section header (missing closing bracket)`);
        }
      }

      // Check for key-value pairs
      if (!line.startsWith('[') && line.includes('=')) {
        const parts = line.split('=');
        if (parts.length > 2) {
          result.warnings.push(`Line ${i + 1}: Multiple '=' signs, may cause parsing issues`);
        }
        if (parts[0].trim().length === 0) {
          result.isValid = false;
          result.errors.push(`Line ${i + 1}: Empty key name`);
        }
      }
    }

    return result;
  }

  /**
   * Get default vdirsyncer config path
   * 
   * @returns Default config path with $HOME expansion
   */
  static getDefaultVdirsyncerPath(): string {
    return '$HOME/.config/vdirsyncer/config';
  }

  /**
   * Check if config file exists
   * 
   * @param configPath Path to config file (supports $HOME expansion)
   * @returns True if file exists
   */
  static async checkConfigExists(configPath: string): Promise<boolean> {
    const expandedPath = this.expandPath(configPath);
    
    try {
      return fs.existsSync(expandedPath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Expand $HOME and ~ in file paths
   * 
   * @param filePath Path that may contain $HOME or ~
   * @returns Expanded path
   */
  private static expandPath(filePath: string): string {
    if (filePath.startsWith('$HOME')) {
      return filePath.replace('$HOME', os.homedir());
    }
    if (filePath.startsWith('~')) {
      return filePath.replace('~', os.homedir());
    }
    return filePath;
  }
}
