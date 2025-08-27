uniform float uTime;
uniform float uHover;
uniform float uScale;
uniform vec3 uLayoutParams; // x: wave amplitude, y: helix height, z: wave frequency

varying vec2 vUv;
varying float vDepth;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  
  vec3 pos = position;
  
  // Apply scale with hover animation
  float scale = uScale * (1.0 + uHover * 0.1);
  pos *= scale;
  
  // Calculate depth for fading (0 = front, 1 = back)
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDepth = (-mvPosition.z - 500.0) / 1000.0;
  vDepth = clamp(vDepth, 0.0, 1.0);
  
  gl_Position = projectionMatrix * mvPosition;
}