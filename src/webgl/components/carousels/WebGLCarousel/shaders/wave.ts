export const waveVertex = `
uniform float uTime;
uniform float uProgress;
uniform float uTransition;
uniform float uDistortion;
uniform vec2 uMouse;
uniform float uParallax;

varying vec2 vUv;
varying float vWave;

void main() {
  vUv = uv;
  
  vec3 pos = position;
  
  // Wave effect
  float frequency = 8.0;
  float amplitude = 50.0 * uTransition;
  float wave = sin(uv.x * frequency + uTime * 2.0 + uProgress * 10.0) * amplitude;
  wave += sin(uv.y * frequency * 0.7 + uTime * 1.5) * amplitude * 0.5;
  
  // Apply distortion
  wave *= (1.0 + uDistortion);
  
  // Z-axis wave
  pos.z += wave;
  
  // Parallax effect
  pos.xy += uMouse * uParallax * 100.0;
  
  vWave = wave / amplitude;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

export const waveFragment = `
uniform sampler2D uTexture;
uniform float uTime;
uniform float uProgress;
uniform float uTransition;
uniform float uOpacity;
uniform float uBlur;
uniform vec2 uResolution;

varying vec2 vUv;
varying float vWave;

void main() {
  vec2 uv = vUv;
  
  // Add wave distortion to UV
  float distortAmount = uTransition * 0.1;
  uv.x += sin(uv.y * 20.0 + uTime) * distortAmount * vWave;
  uv.y += cos(uv.x * 20.0 + uTime) * distortAmount * vWave * 0.5;
  
  vec4 color = texture2D(uTexture, uv);
  
  // Apply blur if needed
  if (uBlur > 0.0) {
    vec2 texelSize = 1.0 / uResolution;
    vec4 blur = vec4(0.0);
    float total = 0.0;
    
    for(float x = -2.0; x <= 2.0; x += 1.0) {
      for(float y = -2.0; y <= 2.0; y += 1.0) {
        vec2 offset = vec2(x, y) * texelSize * uBlur * 100.0;
        blur += texture2D(uTexture, uv + offset);
        total += 1.0;
      }
    }
    
    color = mix(color, blur / total, uBlur);
  }
  
  // Wave-based brightness modulation
  color.rgb *= 1.0 + vWave * 0.2 * uTransition;
  
  // Apply opacity
  color.a *= uOpacity;
  
  gl_FragColor = color;
}
`