import { z } from 'zod';

// Base schema for all items
const BaseItemSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  checksum: z.string().optional(),
  last_updated: z.string().optional(),
  visualization: z.object({
    color: z.string().optional(),
    icon: z.string().optional(),
    radius: z.number().optional(),
    angle: z.number().optional(),
  }).optional(),
});

const ProjectSchema = BaseItemSchema.extend({
  type: z.literal('project'),
  tech: z.string().optional(),
  file: z.string().optional(),
  port: z.string().optional(),
  features: z.array(z.string()).optional(),
});

const ConfigSchema = BaseItemSchema.extend({
  type: z.enum(['config', 'device_config']),
  file: z.string().optional(),
  purpose: z.string().optional(),
  contains: z.array(z.string()).optional(),
  includes: z.array(z.string()).optional(),
  board: z.string().optional(),
  sensors: z.array(z.string()).optional(),
  display: z.string().optional(),
  touch: z.string().optional(),
  features: z.array(z.string()).optional(),
});

const ReferenceSchema = BaseItemSchema.extend({
  type: z.literal('reference'),
  file: z.string().optional(),
  pins: z.array(z.string()).optional(),
  contains: z.array(z.string()).optional(),
  colors: z.array(z.object({
    color: z.string(),
    usage: z.string(),
  })).optional(),
  commands: z.array(z.string()).optional(),
  command: z.string().optional(),
  steps: z.array(z.string()).optional(),
});

const HardwareSchema = BaseItemSchema.extend({
  type: z.enum(['hardware', 'architecture', 'setup']),
  structure: z.array(z.string()).optional(),
  os: z.string().optional(),
  components: z.array(z.string()).optional(),
  storage: z.string().optional(),
  models: z.array(z.string()).optional(),
  board: z.string().optional(),
  firmware: z.string().optional(),
  probe: z.string().optional(),
  configs: z.array(z.string()).optional(),
  vehicle: z.string().optional(),
  unit: z.string().optional(),
  features: z.array(z.string()).optional(),
});

const BusinessSchema = BaseItemSchema.extend({
  type: z.enum(['business', 'business_structure', 'brand', 'strategy']),
  stack: z.record(z.string()).optional(),
  features: z.array(z.string()).optional(),
  deployment: z.array(z.string()).optional(),
  subsidiaries: z.array(z.string()).optional(),
  domain: z.string().optional(),
  concept: z.string().optional(),
  sub_brands: z.array(z.string()).optional(),
  notes: z.string().optional(),
  phases: z.array(z.object({
    phase: z.string(),
    focus: z.string(),
    details: z.array(z.string()),
  })).optional(),
});

const SensorSchema = BaseItemSchema.extend({
  type: z.literal('sensor'),
  interface: z.string().optional(),
  baud: z.string().optional(),
  pins: z.string().optional(),
  component: z.string().optional(),
  attenuation: z.string().optional(),
  update_interval: z.string().optional(),
  note: z.string().optional(),
});

const FileLocationSchema = BaseItemSchema.extend({
  type: z.literal('file_location'),
  path: z.string().optional(),
});

// Recursive definition
export const InventoryItemSchema: z.ZodType<any> = z.lazy(() => 
  z.union([
    // Category is defined inline here to allow recursion
    BaseItemSchema.extend({
      type: z.literal('category'),
      children: z.array(InventoryItemSchema).optional(),
      items: z.array(z.string()).optional(),
    }),
    ProjectSchema,
    ConfigSchema,
    ReferenceSchema,
    HardwareSchema,
    BusinessSchema,
    SensorSchema,
    FileLocationSchema,
    // Root schema is also similar to category but type='root'
    BaseItemSchema.extend({
      type: z.literal('root'),
      children: z.array(InventoryItemSchema).optional(),
    }),
    BaseItemSchema.passthrough(),
  ])
);

export const RootSchema = BaseItemSchema.extend({
  type: z.literal('root'),
  children: z.array(InventoryItemSchema),
});

export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type RootInventory = z.infer<typeof RootSchema>;
