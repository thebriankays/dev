uniform float uTime;
uniform vec2 uMouse;

varying vec2 vUv;
varying float vDistortion;

void main() {
  vec3 color = vec3(1.0);
  
  // Add color variation based on distortion
  color.r += vDistortion * 0.5;
  color.b -= vDistortion * 0.3;
  
  // Add subtle gradient
  color *= 0.8 + vUv.y * 0.2;
  
  // Pulse effect
  float pulse = sin(uTime * 2.0) * 0.1 + 0.9;
  color *= pulse;
  
  // Mouse glow effect
  float mouseDistance = distance(vUv, uMouse * 0.5 + 0.5);
  float glow = 1.0 - smoothstep(0.0, 0.5, mouseDistance);
  color += glow * 0.2;
  
  gl_FragColor = vec4(color, 1.0);
}