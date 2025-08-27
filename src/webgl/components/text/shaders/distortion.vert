uniform float uTime;
uniform float uDistortion;
uniform vec2 uMouse;

varying vec2 vUv;
varying float vDistortion;

void main() {
  vUv = uv;
  
  vec3 pos = position;
  
  // Calculate distance from mouse
  float mouseDistance = distance(uv, uMouse * 0.5 + 0.5);
  float mouseInfluence = smoothstep(1.0, 0.0, mouseDistance);
  
  // Apply wave distortion
  float wave = sin(uv.x * 10.0 + uTime * 2.0) * 0.1;
  wave += sin(uv.y * 15.0 + uTime * 3.0) * 0.05;
  wave *= uDistortion;
  
  // Apply mouse influence
  wave += mouseInfluence * 0.2 * sin(uTime * 5.0);
  
  pos.z += wave * 50.0;
  vDistortion = wave;
  
  // Add slight position offset based on mouse
  pos.xy += uMouse * mouseInfluence * 20.0;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}