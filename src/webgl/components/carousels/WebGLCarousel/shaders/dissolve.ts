export const dissolveVertex = `
uniform float uTime;
uniform float uProgress;
uniform float uTransition;
uniform vec2 uMouse;
uniform float uParallax;

varying vec2 vUv;

void main() {
  vUv = uv;
  
  vec3 pos = position;
  
  // Parallax effect
  pos.xy += uMouse * uParallax * 100.0;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

export const dissolveFragment = `
uniform sampler2D uTexture;
uniform float uTime;
uniform float uProgress;
uniform float uTransition;
uniform float uOpacity;
uniform float uBlur;
uniform vec2 uResolution;

varying vec2 vUv;

// Simple noise function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = vUv;
  
  vec4 color = texture2D(uTexture, uv);
  
  // Create dissolve pattern
  float dissolvePattern = noise(uv * 10.0 + uTime * 0.5);
  dissolvePattern += noise(uv * 50.0 + uTime * 0.2) * 0.5;
  dissolvePattern = smoothstep(0.4, 0.6, dissolvePattern);
  
  // Apply dissolve based on transition
  float dissolveThreshold = uTransition;
  float dissolve = smoothstep(
    dissolveThreshold - 0.1,
    dissolveThreshold + 0.1,
    dissolvePattern
  );
  
  // Edge glow effect
  float edge = abs(dissolvePattern - dissolveThreshold);
  vec3 edgeColor = vec3(1.0, 0.8, 0.6);
  color.rgb = mix(color.rgb, edgeColor, (1.0 - smoothstep(0.0, 0.1, edge)) * uTransition);
  
  // Apply blur if needed
  if (uBlur > 0.0) {
    vec2 texelSize = 1.0 / uResolution;
    vec4 blur = vec4(0.0);
    
    for(float i = -2.0; i <= 2.0; i += 1.0) {
      vec2 offset = vec2(i, 0.0) * texelSize * uBlur * 100.0;
      blur += texture2D(uTexture, uv + offset) * (1.0 - abs(i) / 3.0);
    }
    
    color = mix(color, blur / 3.0, uBlur);
  }
  
  // Apply dissolve alpha
  color.a *= mix(1.0, dissolve, uTransition) * uOpacity;
  
  gl_FragColor = color;
}
`