# Whatamesh Component Documentation

## Overview

The Whatamesh component is a WebGL-powered animated gradient background based on the original Stripe gradient animation. It has been adapted for the shared canvas architecture of this Payload CMS 3 website, providing a flowing, organic gradient effect as the site's base visual layer.

## Implementation Details

### Component Architecture

```
src/webgl/components/whatamesh/
├── index.tsx           # Main export and CSS variable initialization
├── Whatamesh.tsx       # Core React/Three.js component
├── shaders/
│   ├── whatamesh.vert  # Vertex shader (noise-based deformation)
│   └── whatamesh.frag  # Fragment shader (color output)
├── WhatameshDemo.tsx   # Interactive demo component
├── WhatameshTest.tsx   # Isolated test component
└── README.md          # Component documentation
```

### Key Features

1. **Four-Color Gradient System**
   - Reads colors from CSS variables (`--gradient-color-1` through `--gradient-color-4`)
   - Supports theme switching (light/dark themes have different gradients)
   - Smooth blending using noise-based mixing

2. **Noise-Based Animation**
   - Simplex 3D noise for organic movement
   - Multi-layered noise for complex patterns
   - Vertex displacement creates depth and movement

3. **Performance Optimized**
   - Runs entirely on GPU
   - Demand-based rendering (only updates when needed)
   - Dynamic segment density based on viewport

4. **Shared Canvas Integration**
   - Renders as background layer in SharedCanvas
   - Behind all View components (z = -1000)
   - Non-interactive by default

## Usage

### Basic Integration

The Whatamesh background is automatically included in the SharedCanvas:

```tsx
// In src/app/(frontend)/layout.client.tsx
<SharedCanvas background="whatamesh" />
```

### Custom Configuration

```tsx
<SharedCanvas 
  background="whatamesh"
  backgroundProps={{
    amplitude: 320,      // Wave amplitude
    speed: 1,           // Animation speed
    freqX: 0.00014,     // Horizontal frequency
    freqY: 0.00029,     // Vertical frequency
    seed: 5,            // Random seed
    darkenTop: false,   // Top darkening effect
    shadowPower: 5      // Shadow strength
  }}
/>
```

### CSS Variables

Define gradient colors in your global CSS:

```css
:root {
  /* Light theme colors */
  --gradient-color-1: #667eea;
  --gradient-color-2: #764ba2;
  --gradient-color-3: #f093fb;
  --gradient-color-4: #feca57;
}

[data-theme='dark'] {
  /* Dark theme colors */
  --gradient-color-1: #4c1d95;
  --gradient-color-2: #5b21b6;
  --gradient-color-3: #7c3aed;
  --gradient-color-4: #8b5cf6;
}
```

## Technical Implementation

### Shader Pipeline

#### Vertex Shader
1. Calculate UV coordinates and normalize them
2. Apply time-based noise for vertex displacement
3. Create tilting and incline effects
4. Blend colors using multiple noise layers
5. Pass interpolated color to fragment shader

#### Fragment Shader
1. Receive color from vertex shader
2. Optional: Apply darkening effect to top
3. Output final color

### Uniforms Structure

The component uses a complex uniform structure matching the original Whatamesh:

```javascript
uniforms = {
  // Time and animation
  u_time: float,
  u_shadow_power: float,
  u_darken_top: float,
  u_active_colors: vec4,
  
  // Common uniforms
  resolution: vec2,
  aspectRatio: float,
  projectionMatrix: mat4,
  modelViewMatrix: mat4,
  
  // Global settings
  u_global: {
    noiseFreq: vec2,
    noiseSpeed: float
  },
  
  // Vertex deformation
  u_vertDeform: {
    incline: float,
    offsetTop: float,
    offsetBottom: float,
    noiseFreq: vec2,
    noiseAmp: float,
    noiseSpeed: float,
    noiseFlow: float,
    noiseSeed: float
  },
  
  // Base color
  u_baseColor: vec3,
  
  // Wave layers (3 additional colors)
  u_waveLayers: [
    {
      color: vec3,
      noiseFreq: vec2,
      noiseSpeed: float,
      noiseFlow: float,
      noiseSeed: float,
      noiseFloor: float,
      noiseCeil: float
    }
  ]
}
```

### Color Loading Process

1. Component mounts and checks for CSS variables
2. Retries loading if variables not yet available
3. Converts hex colors to normalized RGB values
4. Updates shader uniforms with color values
5. Listens for theme changes and updates colors

## Performance Considerations

### Optimization Strategies

1. **Segment Density**: Calculated based on viewport size
   - X segments: `Math.ceil(width * 0.06)`
   - Y segments: `Math.ceil(height * 0.16)`

2. **Render Loop**: Uses demand frame loop
   - Only renders when `invalidate()` is called
   - Automatic on scroll, resize, or interaction

3. **GPU Computation**: All animation math on GPU
   - Noise calculations in vertex shader
   - No JavaScript animation loops

## Differences from Original

### Adaptations Made

1. **React Three Fiber Integration**
   - Converted from vanilla WebGL to R3F
   - Uses Three.js ShaderMaterial

2. **Shared Canvas Architecture**
   - Renders as part of unified canvas
   - Positioned behind all other content

3. **CSS Variable Integration**
   - Automatic theme support
   - Runtime color updates

4. **Removed Features**
   - Mouse interaction (not needed for background)
   - Scroll observer (handled by shared canvas)
   - Color toggle functionality

## Troubleshooting

### Common Issues

1. **Colors Not Loading**
   - Ensure CSS variables are defined
   - Check theme is set before mount
   - Verify variable names match

2. **Performance Issues**
   - Reduce amplitude value
   - Lower segment density
   - Disable on mobile devices

3. **Not Visible**
   - Check z-position (-1000)
   - Verify SharedCanvas has `background="whatamesh"`
   - Ensure canvas is mounted

## Demo Pages

- `/whatamesh-demo` - Interactive demo with presets
- `/webgl-test` - Isolated component test

## Future Enhancements

- [ ] Mobile performance mode
- [ ] Additional noise patterns
- [ ] Color transition animations
- [ ] Interactive mode for special pages
- [ ] Performance metrics dashboard

## References

- [Original Whatamesh](https://kevinhufnagl.com) - Stripe's gradient
- [Simplex Noise](https://github.com/ashima/webgl-noise) - Noise implementation
- [GLSL Blend](https://github.com/jamieowen/glsl-blend) - Blending functions