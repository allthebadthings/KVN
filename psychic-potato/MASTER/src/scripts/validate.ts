import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { InventoryItemSchema } from './schema.js';

const TARGET_DIR = path.resolve(process.cwd(), 'src/data/inventory_exploded');
const REPORT_FILE = path.resolve(process.cwd(), 'validation_report.json');

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const results: ValidationResult[] = [];

function calculateChecksum(content: object): string {
  const { checksum, ...rest } = content as any;
  const str = JSON.stringify(rest);
  return crypto.createHash('md5').update(str).digest('hex');
}

function validateFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let data;
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    data = JSON.parse(content);
  } catch (e) {
    results.push({
      file: filePath,
      valid: false,
      errors: ['Invalid JSON format'],
      warnings: [],
    });
    return;
  }

  // Schema Validation
  const validation = InventoryItemSchema.safeParse(data);
  if (!validation.success) {
    validation.error.issues.forEach(issue => {
      errors.push(`${issue.path.join('.')}: ${issue.message}`);
    });
  }

  // Integrity Check
  if (data.checksum) {
    const calculated = calculateChecksum(data);
    if (calculated !== data.checksum) {
      errors.push(`Checksum mismatch: expected ${data.checksum}, got ${calculated}`);
    }
  } else {
    warnings.push('Missing checksum');
  }

  // Timestamp Check
  if (!data.last_updated) {
    warnings.push('Missing last_updated timestamp');
  }

  results.push({
    file: filePath,
    valid: errors.length === 0,
    errors,
    warnings,
  });
}

function traverseAndValidate(dir: string) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Check for _meta.json
      const metaPath = path.join(fullPath, '_meta.json');
      if (fs.existsSync(metaPath)) {
        validateFile(metaPath);
      }
      traverseAndValidate(fullPath);
    } else if (item.endsWith('.json') && item !== '_meta.json') {
      validateFile(fullPath);
    }
  });
}

console.log(`Starting validation on ${TARGET_DIR}...`);
traverseAndValidate(TARGET_DIR);

const validCount = results.filter(r => r.valid).length;
const invalidCount = results.filter(r => !r.valid).length;

console.log(`Validation complete.`);
console.log(`Valid files: ${validCount}`);
console.log(`Invalid files: ${invalidCount}`);

fs.writeFileSync(REPORT_FILE, JSON.stringify({
  timestamp: new Date().toISOString(),
  summary: {
    total: results.length,
    valid: validCount,
    invalid: invalidCount,
  },
  details: results,
}, null, 2));

console.log(`Report saved to ${REPORT_FILE}`);
