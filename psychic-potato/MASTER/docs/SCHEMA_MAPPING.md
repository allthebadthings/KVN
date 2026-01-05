# Schema Mapping and Data Population Documentation

## 1. Directory Structure Implementation

The data population system transforms the hierarchical `inventory.json` into a file-system based structure located at `src/data/inventory_exploded/`.

### Structure Overview
- **Root Directory**: `src/data/inventory_exploded/`
- **Categories**: Represented as sub-directories.
- **Leaf Items**: Represented as individual JSON files (e.g., `item_name.json`).
- **Metadata**: Each directory contains a `_meta.json` file describing the category itself.

### Naming Convention
- Directory and file names are sanitized: lowercased, spaces replaced with underscores, special characters removed.
- Example: "Business Tracker Notebook" -> `business_tracker_notebook.json`

## 2. Schema Population

The system maps fields from the source inventory to the destination files with 100% coverage.

### Mapping Rules
| Schema Field | File Field | Description |
|--------------|------------|-------------|
| `name` | `name` | Display name of the item |
| `type` | `type` | Item type (e.g., `project`, `config`) |
| `description`| `description` | Optional description |
| `children` | (Directory Structure) | Nested children become sub-directories or files |
| `features` | `features` | Array of feature strings |
| (Specifics) | (Same Name) | Type-specific fields like `board`, `pins`, etc. are preserved |

### Data Transformation
- **Type Inference**: Items missing a `type` but having a `path` are assigned `type: 'file_location'`.
- **Visualization Defaults**: Items missing visualization metadata are assigned default values (color, radius, angle).

## 3. Data Integrity Measures

### Checksums
- Every generated JSON file includes a `checksum` field.
- **Algorithm**: MD5 hash of the content (excluding `checksum` itself).
- **Verification**: The validation script recalculates the hash and compares it with the stored value.

### Timestamp Validation
- Every file includes a `last_updated` field (ISO 8601 timestamp).
- The validation system warns if this field is missing.

## 4. Validation System

An automated validation script (`src/scripts/validate.ts`) checks the integrity of the populated data.

### Checks Performed
1.  **JSON Syntax**: Ensures files are valid JSON.
2.  **Schema Compliance**: Validates against Zod definitions in `src/scripts/schema.ts`.
3.  **Data Integrity**: Verifies MD5 checksums.
4.  **Field Completeness**: Checks for required fields like `name`, `type`, `last_updated`.

### Running Validation
```bash
npx tsx src/scripts/validate.ts
```
Generates a report at `validation_report.json`.

## 5. Jupyter Integration Preparation

The file-based structure is designed to be easily consumable by Jupyter notebooks (Python) or other analysis tools.

### Data Access Layer (Concept)
For Python/Jupyter, use the `json` and `os` modules to traverse the directory structure.

```python
import os
import json

ROOT_DIR = 'src/data/inventory_exploded'

def load_inventory(root_dir):
    inventory = {}
    for root, dirs, files in os.walk(root_dir):
        # Process files...
        pass
    return inventory
```

### Visualization Support
Data includes `visualization` metadata:
- `color`: Hex color code
- `radius`: Radial position
- `angle`: Angular position
- `icon`: Optional icon identifier

These fields drive the "Orbital Ring" and other circular pattern visualizations.

## 6. Version Control
- **Schema**: Defined in `src/scripts/schema.ts` (Git tracked).
- **Implementation**: Scripts in `src/scripts/` (Git tracked).
- **Data**: `inventory.json` is the source of truth. The exploded structure is a derived artifact but can be committed if desired.
