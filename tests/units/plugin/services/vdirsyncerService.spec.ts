import { describe, it, expect } from 'vitest';
import { VdirsyncerService } from '../../../../src/plugin/services/vdirsyncerService';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('VdirsyncerService', () => {
  const testConfigDir = `/tmp/test-vdirsyncer-${Date.now()}`;
  const testConfigPath = path.join(testConfigDir, 'config');

  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  describe('readVdirsyncerConfig', () => {
    it('should read config file', async () => {
      const content = '[general]\nstatus_path = "~/.vdirsyncer/status/"\n';
      fs.writeFileSync(testConfigPath, content);

      const result = await VdirsyncerService.readVdirsyncerConfig(testConfigPath);
      expect(result).toBe(content);
    });

    it('should throw error if file does not exist', async () => {
      await expect(
        VdirsyncerService.readVdirsyncerConfig('/non/existent/path')
      ).rejects.toThrow('Failed to read vdirsyncer config');
    });

    it('should expand $HOME in path', async () => {
      const homeDir = os.homedir();
      const relativePath = path.relative(homeDir, testConfigPath);
      const pathWithHome = `$HOME/${relativePath}`;
      
      const content = '[general]\n';
      fs.writeFileSync(testConfigPath, content);

      const result = await VdirsyncerService.readVdirsyncerConfig(pathWithHome);
      expect(result).toBe(content);
    });
  });

  describe('writeVdirsyncerConfig', () => {
    it('should write config file', async () => {
      const content = '[general]\nstatus_path = "~/.vdirsyncer/status/"\n';
      const writePath = path.join(testConfigDir, 'write-test-config');

      await VdirsyncerService.writeVdirsyncerConfig(writePath, content);
      
      expect(fs.existsSync(writePath)).toBe(true);
      const written = fs.readFileSync(writePath, 'utf-8');
      expect(written).toBe(content);
    });

    it('should create directory if it does not exist', async () => {
      const newDir = path.join(testConfigDir, 'new-dir');
      const writePath = path.join(newDir, 'config');
      const content = '[general]\n';

      await VdirsyncerService.writeVdirsyncerConfig(writePath, content);
      
      expect(fs.existsSync(writePath)).toBe(true);
    });

    it('should expand $HOME in path', async () => {
      const homeDir = os.homedir();
      const tempFile = path.join(homeDir, `.vdirsyncer-test-${Date.now()}`);
      const pathWithHome = tempFile.replace(homeDir, '$HOME');
      
      const content = '[general]\n';
      
      try {
        await VdirsyncerService.writeVdirsyncerConfig(pathWithHome, content);
        expect(fs.existsSync(tempFile)).toBe(true);
      } finally {
        // Cleanup
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe('validateVdirsyncerConfig', () => {
    it('should validate valid config', () => {
      const content = `[general]
status_path = "~/.vdirsyncer/status/"

[pair contacts]
a = "contacts_local"
b = "contacts_remote"
collections = ["from a", "from b"]

[storage contacts_local]
type = "filesystem"
path = "~/.contacts/"
fileext = ".vcf"

[storage contacts_remote]
type = "carddav"
url = "https://example.com/carddav/"
username = "user"
password = "pass"
`;

      const result = VdirsyncerService.validateVdirsyncerConfig(content);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty config', () => {
      const result = VdirsyncerService.validateVdirsyncerConfig('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Config file is empty');
    });

    it('should warn about missing sections', () => {
      const content = '# Just a comment\n';
      const result = VdirsyncerService.validateVdirsyncerConfig(content);
      
      expect(result.warnings).toContain('Missing [general] section');
      expect(result.warnings).toContain('No [pair] sections found');
      expect(result.warnings).toContain('No [storage] sections found');
    });

    it('should detect invalid section headers', () => {
      const content = '[general\nstatus_path = "~/.vdirsyncer/status/"\n';
      const result = VdirsyncerService.validateVdirsyncerConfig(content);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid section header'))).toBe(true);
    });

    it('should detect empty key names', () => {
      const content = '[general]\n= "value"\n';
      const result = VdirsyncerService.validateVdirsyncerConfig(content);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Empty key name'))).toBe(true);
    });

    it('should warn about multiple equals signs', () => {
      const content = '[general]\nurl = "http://example.com?param=value"\n';
      const result = VdirsyncerService.validateVdirsyncerConfig(content);
      
      expect(result.warnings.some(w => w.includes("Multiple '=' signs"))).toBe(true);
    });

    it('should ignore comments', () => {
      const content = `# This is a comment
; This is also a comment
[general]
# Another comment
status_path = "~/.vdirsyncer/status/"
`;

      const result = VdirsyncerService.validateVdirsyncerConfig(content);
      expect(result.isValid).toBe(true);
    });
  });

  describe('getDefaultVdirsyncerPath', () => {
    it('should return default path', () => {
      const defaultPath = VdirsyncerService.getDefaultVdirsyncerPath();
      expect(defaultPath).toBe('$HOME/.config/vdirsyncer/config');
    });
  });

  describe('checkConfigExists', () => {
    it('should return true if config exists', async () => {
      const content = '[general]\n';
      fs.writeFileSync(testConfigPath, content);

      const exists = await VdirsyncerService.checkConfigExists(testConfigPath);
      expect(exists).toBe(true);
    });

    it('should return false if config does not exist', async () => {
      const exists = await VdirsyncerService.checkConfigExists('/non/existent/path');
      expect(exists).toBe(false);
    });

    it('should expand $HOME in path', async () => {
      const homeDir = os.homedir();
      const relativePath = path.relative(homeDir, testConfigPath);
      const pathWithHome = `$HOME/${relativePath}`;
      
      const content = '[general]\n';
      fs.writeFileSync(testConfigPath, content);

      const exists = await VdirsyncerService.checkConfigExists(pathWithHome);
      expect(exists).toBe(true);
    });

    it('should expand ~ in path', async () => {
      const homeDir = os.homedir();
      const tempFile = path.join(homeDir, `.vdirsyncer-test-${Date.now()}`);
      const pathWithTilde = tempFile.replace(homeDir, '~');
      
      try {
        fs.writeFileSync(tempFile, '[general]\n');
        const exists = await VdirsyncerService.checkConfigExists(pathWithTilde);
        expect(exists).toBe(true);
      } finally {
        // Cleanup
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });
});
