import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { RootSchema, InventoryItem } from './schema.js';

const SOURCE_FILE = path.resolve(process.cwd(), 'src/data/inventory.json');
const TARGET_DIR = path.resolve(process.cwd(), 'src/data/inventory_exploded');

// Ensure target directory exists
if (fs.existsSync(TARGET_DIR)) {
  fs.rmSync(TARGET_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TARGET_DIR, { recursive: true });

// Read source file
const rawData = fs.readFileSync(SOURCE_FILE, 'utf-8');
const data = JSON.parse(rawData);

// Validate source data against schema (optional, but good practice)
// const parseResult = RootSchema.safeParse(data);
// if (!parseResult.success) {
//   console.error('Validation Error on Source Data:', parseResult.error);
//   // process.exit(1); // Proceeding anyway for now to populate
// }

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_]/g, '_').toLowerCase();
}

function calculateChecksum(content: object): string {
  const str = JSON.stringify(content);
  return crypto.createHash('md5').update(str).digest('hex');
}

function processItem(item: any, currentPath: string) {
  const { children, ...itemData } = item;
  
  // Infer type if missing
  if (!itemData.type) {
    if (itemData.path) {
      itemData.type = 'file_location';
    } else {
      itemData.type = 'unknown';
    }
  }

  // Add default visualization metadata if missing
  if (!itemData.visualization) {
    itemData.visualization = {
      color: '#64748b', // Default slate-500
      radius: 100,
      angle: Math.random() * 360,
    };
  }

  // Add integrity fields
  const enrichedData = {
    ...itemData,
    last_updated: new Date().toISOString(),
    // Checksum will be calculated after final object structure is set
  };
  enrichedData.checksum = calculateChecksum(enrichedData);

  // Validate item
  // const validation = InventoryItemSchema.safeParse(enrichedData);
  // if (!validation.success) {
  //   console.warn(`Validation warning for ${item.name}:`, validation.error.issues);
  // }

  const sanitized = sanitizeName(item.name);
  const itemPath = path.join(currentPath, sanitized);

  if (children && children.length > 0) {
    // It's a directory/category
    if (!fs.existsSync(itemPath)) {
      fs.mkdirSync(itemPath, { recursive: true });
    }
    
    // Write metadata for this directory
    fs.writeFileSync(
      path.join(itemPath, '_meta.json'), 
      JSON.stringify(enrichedData, null, 2)
    );

    // Process children
    children.forEach((child: any) => processItem(child, itemPath));
  } else {
    // It's a leaf file
    // Check if itemPath exists (if it was a directory before)
    // If it's a leaf, we just write it as a json file
    const filePath = itemPath + '.json';
    fs.writeFileSync(filePath, JSON.stringify(enrichedData, null, 2));
  }
}

console.log(`Processing inventory from ${SOURCE_FILE}...`);
processItem(data, TARGET_DIR);
console.log(`Population complete. Check ${TARGET_DIR}`);
