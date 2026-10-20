# Design Config V3 Schema

Version 3 of the certificate design configuration schema. This is our own schema, not raw Fabric.js JSON, designed for portability, validation, and server-side rendering.

## Overview

Design Config V3 represents a certificate design as a structured JSON document with:
- **Version**: Always `3` for this schema
- **Pages**: Array of pages (currently single-page certificates)
- **Elements**: Positioned design elements (text, fields, shapes, images, QR codes)
- **Type Safety**: Full Zod validation + TypeScript types

## Schema Structure

```typescript
{
  version: 3,
  pages: [{
    width: 1123,        // Design units (default px)
    height: 794,
    unit: 'px' | 'mm' | 'in' | 'pt',
    background: {
      type: 'color' | 'gradient' | 'image',
      // ... type-specific properties
    },
    elements: [...]     // Array of design elements
  }]
}
```

## Element Types

### 1. Text Element
Static text content with styling.

```typescript
{
  type: 'text',
  id: 'unique-id',
  text: 'Certificate of Completion',
  fontFamily: 'Inter',
  fontSize: 48,
  fontWeight: 'normal' | 'bold',
  fontStyle: 'normal' | 'italic',
  fill: '#000000',
  textAlign: 'left' | 'center' | 'right' | 'justify',
  // Transform properties
  x: 100,
  y: 200,
  width: 900,
  height: 60,
  angle: 0,
  scaleX: 1,
  scaleY: 1,
  originX: 'left' | 'center' | 'right',
  originY: 'top' | 'center' | 'bottom',
  opacity: 1
}
```

### 2. Field Element
Dynamic per-recipient data with auto-shrink support.

```typescript
{
  type: 'field',
  id: 'unique-id',
  field: 'recipient_name' | 'issue_date' | 'credential_id' | ...,
  // Text styling (same as text element)
  fontFamily: 'Inter',
  fontSize: 36,
  fill: '#000000',
  // Auto-shrink configuration
  autoShrink: true,
  minFontSize: 18,
  maxLines: 1,
  dateFormat: 'MMMM d, yyyy',  // For date fields
  placeholder: 'Recipient Name',
  // Transform properties
  ...
}
```

**Supported Fields:**
- `recipient_name`, `recipient_email`
- `issue_date`, `expiry_date` (with optional `dateFormat`)
- `credential_id`, `course_name`, `description`
- `grade`, `score`
- `custom_1`, `custom_2`, `custom_3`

### 3. Image Element
Uploaded images (logos, photos, backgrounds).

```typescript
{
  type: 'image',
  id: 'unique-id',
  imageUrl: 'https://...' | '/uploads/...',
  fit: 'fill' | 'contain' | 'cover',
  filters: [{
    type: 'brightness',
    options: { brightness: 0.2 }
  }],
  // Transform properties
  ...
}
```

### 4. Signature Element
Signature images or styled text signatures.

```typescript
{
  type: 'signature',
  id: 'unique-id',
  signatureType: 'image' | 'text',
  imageUrl: 'https://...',    // For image signatures
  text: 'John Doe',           // For text signatures
  fontFamily: 'Brush Script', // For text signatures
  fontSize: 32,
  fill: '#000080',
  // Transform properties
  ...
}
```

### 5. Shape Element
Vector shapes for borders, backgrounds, decorations.

**Rectangle:**
```typescript
{
  type: 'shape',
  id: 'unique-id',
  shape: 'rect',
  fill: '#000000' | 'transparent',
  stroke: '#000000',
  strokeWidth: 2,
  strokeDashArray: [5, 5],  // Optional dashed line
  rx: 10,  // Border radius X
  ry: 10,  // Border radius Y
  // Transform properties
  ...
}
```

**Circle:**
```typescript
{
  type: 'shape',
  id: 'unique-id',
  shape: 'circle',
  radius: 50,
  fill: '#ff0000',
  stroke: '#000000',
  strokeWidth: 1,
  // Transform (no width/height, uses radius)
  x: 500,
  y: 400,
  ...
}
```

**Line:**
```typescript
{
  type: 'shape',
  id: 'unique-id',
  shape: 'line',
  x1: 100,
  y1: 100,
  x2: 900,
  y2: 100,
  stroke: '#000000',
  strokeWidth: 2,
  strokeDashArray: [10, 5]
}
```

**Custom Path:**
```typescript
{
  type: 'shape',
  id: 'unique-id',
  shape: 'path',
  path: 'M 0 0 L 100 100 L 0 100 Z',  // SVG path data
  fill: '#000000',
  stroke: '#ffffff',
  strokeWidth: 1,
  // Transform properties
  ...
}
```

### 6. QR Code Element
Dynamic QR codes for verification URLs.

```typescript
{
  type: 'qr',
  id: 'unique-id',
  data: 'https://verify.example.com/{credential_id}',
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H',
  foreground: '#000000',
  background: '#ffffff',
  // Transform properties
  ...
}
```

## Background Types

### Solid Color
```typescript
{
  type: 'color',
  color: '#ffffff'
}
```

### Linear Gradient
```typescript
{
  type: 'gradient',
  gradient: {
    type: 'linear',
    coords: { x1: 0, y1: 0, x2: 1123, y2: 794 },
    stops: [
      { offset: 0, color: '#667eea' },
      { offset: 1, color: '#764ba2' }
    ]
  }
}
```

### Radial Gradient
```typescript
{
  type: 'gradient',
  gradient: {
    type: 'radial',
    coords: { x1: 500, y1: 400, x2: 500, y2: 400, r1: 0, r2: 300 },
    stops: [
      { offset: 0, color: '#ffffff' },
      { offset: 1, color: '#000000' }
    ]
  }
}
```

### Image Background
```typescript
{
  type: 'image',
  imageUrl: 'https://...'
}
```

## Transform Properties

All elements (except line) include transform properties:

```typescript
{
  x: 100,           // Position X
  y: 200,           // Position Y
  width: 300,       // Width
  height: 100,      // Height
  angle: 45,        // Rotation in degrees
  scaleX: 1.5,      // Horizontal scale
  scaleY: 1.0,      // Vertical scale
  originX: 'center',// Transform origin X
  originY: 'center',// Transform origin Y
  opacity: 0.8      // 0-1 transparency
}
```

**Origin Points**: Define the transform origin for rotation/scaling
- `originX`: `'left'`, `'center'`, `'right'`
- `originY`: `'top'`, `'center'`, `'bottom'`

## Usage

### Validation

```typescript
import { parseDesignConfig, validateDesignConfig } from '@/lib/design-config/v3-schema'

// Parse and validate (throws on error)
const config = parseDesignConfig(data)

// Validate without throwing
const result = validateDesignConfig(data)
if (result.success) {
  console.log('Valid:', result.data)
} else {
  console.error('Invalid:', result.error)
}
```

### Creating New Designs

```typescript
import { createEmptyDesignConfig } from '@/lib/design-config/v3-schema'

const config = createEmptyDesignConfig(1123, 794)
config.pages[0].elements.push({
  type: 'text',
  id: 'title',
  text: 'Certificate',
  fontSize: 48,
  fill: '#000000',
  x: 100,
  y: 100,
  width: 900,
  height: 60,
  // ... other required properties
})
```

## Migration

- **From V2**: See Phase 3 migration guide (coming soon)
- **From Fabric JSON**: Use serialization utilities (Phase 1)

## Validation Rules

- Version must be exactly `3`
- Pages array must contain at least 1 page
- All dimensions must be positive numbers
- Font sizes must be positive
- Gradient stops must have 2+ entries with offsets 0-1
- Opacity must be 0-1
- Element IDs should be unique within a page
- Field types must match the enum
- Transform origins must match allowed values

## Benefits Over Raw Fabric JSON

1. **Portable**: Not tied to Fabric.js versions
2. **Validated**: Zod schema catches errors early
3. **Server-Safe**: Can be rendered server-side without Fabric
4. **Typed**: Full TypeScript intellisense
5. **Stable**: Breaking changes to Fabric don't affect saved designs
6. **Efficient**: Only stores necessary data, not internal Fabric state

## Testing

Run schema tests:
```bash
npm test design-config-v3
```

All 15 test cases cover:
- Valid designs (empty, text, fields, gradients, shapes, QR codes)
- Invalid designs (version, dimensions, gradients, fields, opacity)
- Default value application
- TypeScript type inference
