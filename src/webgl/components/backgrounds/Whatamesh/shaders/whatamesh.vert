// Whatamesh/Stripe gradient vertex shader adapted for Three.js
// Based on stripe.com gradient implementation

precision highp float;

// Three.js automatically provides: position, uv, modelViewMatrix, projectionMatrix

varying vec3 v_color;

// Import noise functions inline
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Blend function
vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
  return (blend * opacity + base * (1.0 - opacity));
}

// Main uniforms
uniform float u_time;
uniform vec2 resolution;
uniform vec4 u_active_colors;
uniform vec3 u_baseColor;

// Global uniforms (flattened from struct)
uniform vec2 u_global_noiseFreq;
uniform float u_global_noiseSpeed;

// Vertex deform uniforms (flattened from struct)
uniform float u_vertDeform_incline;
uniform float u_vertDeform_offsetTop;
uniform float u_vertDeform_offsetBottom;
uniform vec2 u_vertDeform_noiseFreq;
uniform float u_vertDeform_noiseAmp;
uniform float u_vertDeform_noiseSpeed;
uniform float u_vertDeform_noiseFlow;
uniform float u_vertDeform_noiseSeed;

// Wave layer uniforms (flattened from array of structs)
uniform vec3 u_waveLayers_color[3];
uniform vec2 u_waveLayers_noiseFreq[3];
uniform float u_waveLayers_noiseSpeed[3];
uniform float u_waveLayers_noiseFlow[3];
uniform float u_waveLayers_noiseSeed[3];
uniform float u_waveLayers_noiseFloor[3];
uniform float u_waveLayers_noiseCeil[3];
const int u_waveLayers_length = 3;

void main() {
  float time = u_time * u_global_noiseSpeed;
  
  // Calculate normalized UV (matching original gradient)
  vec2 uvNorm = uv * 2.0 - 1.0;
  
  vec2 noiseCoord = resolution * uvNorm * u_global_noiseFreq;
  
  vec2 st = 1. - uvNorm.xy;
  
  //
  // Tilting the plane
  //
  
  // Front-to-back tilt
  float tilt = resolution.y / 2.0 * uvNorm.y;
  
  // Left-to-right angle
  float incline = resolution.x * uvNorm.x / 2.0 * u_vertDeform_incline;
  
  // Up-down shift to offset incline
  float offset = resolution.x / 2.0 * u_vertDeform_incline * mix(u_vertDeform_offsetBottom, u_vertDeform_offsetTop, uv.y);
  
  //
  // Vertex noise
  //
  
  float noise = snoise(vec3(
    noiseCoord.x * u_vertDeform_noiseFreq.x + time * u_vertDeform_noiseFlow,
    noiseCoord.y * u_vertDeform_noiseFreq.y,
    time * u_vertDeform_noiseSpeed + u_vertDeform_noiseSeed
  )) * u_vertDeform_noiseAmp;
  
  // Fade noise to zero at edges
  noise *= 1.0 - pow(abs(uvNorm.y), 2.0);
  
  // Clamp to 0
  noise = max(0.0, noise);
  
  vec3 pos = vec3(
    position.x,
    position.y + tilt + incline + noise - offset,
    position.z
  );
  
  //
  // Vertex color, to be passed to fragment shader
  //
  
  // Initialize v_color with base color
  v_color = u_baseColor;
  
  for (int i = 0; i < u_waveLayers_length; i++) {
    if (u_active_colors[i + 1] == 1.) {
      float layerNoise = smoothstep(
        u_waveLayers_noiseFloor[i],
        u_waveLayers_noiseCeil[i],
        snoise(vec3(
          noiseCoord.x * u_waveLayers_noiseFreq[i].x + time * u_waveLayers_noiseFlow[i],
          noiseCoord.y * u_waveLayers_noiseFreq[i].y,
          time * u_waveLayers_noiseSpeed[i] + u_waveLayers_noiseSeed[i]
        )) / 2.0 + 0.5
      );
      
      v_color = blendNormal(v_color, u_waveLayers_color[i], pow(layerNoise, 4.));
    }
  }
  
  //
  // Finish
  //
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}