# Whatamesh Component - Clean Implementation

## Overview

The Whatamesh component is a WebGL-powered animated gradient background based on Stripe's gradient animation. It provides a flowing, organic 4-color gradient effect as the site's base visual layer.

## Files

```
src/webgl/components/whatamesh/
├── index.tsx                  # Main export and wrapper
├── Whatamesh.tsx             # Core WebGL component  
├── WhatameshAdminPreview.tsx # Payload admin preview component
├── shaders/
│   ├── whatamesh.vert        # Vertex shader
│   └── whatamesh.frag        # Fragment shader
└── README.md                 # This file
```

## Usage

### Basic Usage

The Whatamesh background is automatically included in SharedCanvas:

```tsx
// In layout.client.tsx
<SharedCanvas background="whatamesh" />
```

### CSS Variables

The component reads 4 colors from CSS variables:

```css
:root {
  --gradient-color-1: #667eea;
  --gradient-color-2: #764ba2;
  --gradient-color-3: #f093fb;
  --gradient-color-4: #feca57;
}
```

### Configuration Props

```tsx
<SharedCanvas 
  background="whatamesh"
  backgroundProps={{
    amplitude: 320,    // Wave intensity (100-500)
    speed: 1,         // Animation speed (0.1-3)
    freqX: 0.00014,   // Horizontal frequency
    freqY: 0.00029,   // Vertical frequency
    seed: 5,          // Random seed
    darkenTop: false, // Darken top edge
    shadowPower: 5    // Shadow strength
  }}
/>
```

## Payload Admin Integration

### Using the Preview Component

Add the Whatamesh field to your Payload collections or globals:

```typescript
import { whatameshField } from '@/webgl/components/whatamesh'

const HomePage: GlobalConfig = {
  slug: 'home',
  fields: [
    whatameshField, // Adds background configuration with preview
    // ... other fields
  ]
}
```

### Custom Field Configuration

```typescript
import { WhatameshPreview } from '@/webgl/components/whatamesh'

const customField: Field = {
  name: 'background',
  type: 'group',
  admin: {
    components: {
      Field: WhatameshPreview
    }
  },
  fields: [
    // Your custom fields
  ]
}
```

## How It Works

1. **Initialization**
   - Reads 4 colors from CSS variables
   - Falls back to default colors if not set
   - Sets up WebGL shader material

2. **Animation**
   - Simplex 3D noise creates organic movement
   - Multiple noise layers blend the 4 colors
   - Vertex displacement adds depth
   - Runs at 60fps on GPU

3. **Rendering**
   - Positioned at z=-1000 (behind everything)
   - Part of shared canvas context
   - Demand-based frame updates

## Performance

- **GPU Accelerated**: All computation on GPU
- **Optimized Shaders**: Efficient noise algorithms
- **Dynamic LOD**: Segment density based on viewport
- **Demand Rendering**: Only updates when needed

## TypeScript Types

```typescript
interface WhatameshBackgroundProps {
  amplitude?: number      // 100-500
  speed?: number          // 0.1-3
  freqX?: number          // ~0.00014
  freqY?: number          // ~0.00029
  seed?: number           // Random seed
  darkenTop?: boolean     // Top darkening
  shadowPower?: number    // 1-10
}
```

## Demo

View the live demo at `/whatamesh-demo`

## Technical Details

### Shader Uniforms

- Time-based animation
- 4 color inputs
- Noise parameters
- Vertex deformation settings
- Resolution and aspect ratio

### Color System

- Base color (color 1)
- 3 wave layers (colors 2-4)
- Noise-based blending
- Smooth transitions

### Noise Algorithm

Uses Simplex 3D noise (Ashima Arts implementation):
- Better performance than Perlin
- No directional artifacts  
- Continuous and smooth

## Customization

### Change Default Colors

Edit `src/app/(frontend)/globals.css`:

```css
:root {
  --gradient-color-1: #your-color;
  --gradient-color-2: #your-color;
  --gradient-color-3: #your-color;
  --gradient-color-4: #your-color;
}
```

### Adjust Animation

Modify SharedCanvas props:

```tsx
backgroundProps={{
  amplitude: 200,  // Gentler waves
  speed: 0.5,      // Slower animation
}}
```

## Credits

Based on Stripe's WebGL gradient animation, adapted for React Three Fiber and Payload CMS.