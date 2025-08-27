uniform float uDistortion;
uniform float uTime;
uniform float uHover;
uniform vec2 uMouse;
uniform float uParallax;

varying vec2 vUv;
varying float vWave;

void main() {
  vUv = uv;
  
  vec3 pos = position;
  
  // Calculate wave distortion
  float wave = sin(uv.x * 5.0 + uTime * 2.0) * 0.1;
  wave += sin(uv.y * 3.0 + uTime * 1.5) * 0.05;
  wave *= uDistortion;
  
  // Apply hover effect
  float hoverInfluence = smoothstep(0.4, 0.0, distance(uv, vec2(0.5)));
  wave += hoverInfluence * uHover * 0.1;
  
  // Apply wave to z position
  pos.z += wave;
  vWave = wave;
  
  // Apply mouse parallax to position
  pos.xy += uMouse * uParallax * uHover;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}