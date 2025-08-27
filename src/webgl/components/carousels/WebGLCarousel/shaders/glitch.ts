export const glitchVertex = `
uniform float uTime;
uniform float uProgress;
uniform float uTransition;
uniform vec2 uMouse;
uniform float uParallax;

varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
  vUv = uv;
  
  vec3 pos = position;
  
  // Glitch displacement
  float glitchIntensity = uTransition;
  
  // Random horizontal displacement
  if (random(vec2(uTime * 10.0, uv.y)) > 0.95) {
    pos.x += (random(vec2(uTime, uv.y)) - 0.5) * 100.0 * glitchIntensity;
  }
  
  // Block glitch
  float blockSize = 0.1;
  vec2 blockCoord = floor(uv / blockSize) * blockSize;
  if (random(blockCoord + uTime) > 0.9) {
    pos.xy += (random(blockCoord) - 0.5) * 50.0 * glitchIntensity;
  }
  
  // Parallax
  pos.xy += uMouse * uParallax * 100.0;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

export const glitchFragment = `
uniform sampler2D uTexture;
uniform float uTime;
uniform float uProgress;
uniform float uTransition;
uniform float uOpacity;
uniform float uBlur;
uniform vec2 uResolution;

varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;
  
  float glitchIntensity = uTransition;
  
  // Color channel split
  vec2 redOffset = vec2(0.0);
  vec2 greenOffset = vec2(0.0);
  vec2 blueOffset = vec2(0.0);
  
  // Random channel displacement
  if (random(vec2(uTime * 20.0, 0.0)) > 0.8) {
    redOffset.x = (random(vec2(uTime, 1.0)) - 0.5) * 0.02 * glitchIntensity;
    greenOffset.x = (random(vec2(uTime, 2.0)) - 0.5) * 0.02 * glitchIntensity;
    blueOffset.x = (random(vec2(uTime, 3.0)) - 0.5) * 0.02 * glitchIntensity;
  }
  
  // Horizontal line glitch
  float lineNoise = step(0.98, random(vec2(uv.y * 100.0, uTime * 10.0)));
  if (lineNoise > 0.0) {
    uv.x += (random(vec2(uTime, uv.y)) - 0.5) * 0.1 * glitchIntensity;
  }
  
  // Sample with offsets
  float r = texture2D(uTexture, uv + redOffset).r;
  float g = texture2D(uTexture, uv + greenOffset).g;
  float b = texture2D(uTexture, uv + blueOffset).b;
  
  vec4 color = vec4(r, g, b, 1.0);
  
  // Digital noise
  float noise = random(uv + uTime) * 0.1 * glitchIntensity;
  color.rgb += vec3(noise);
  
  // Block corruption
  float blockSize = 0.05;
  vec2 blockCoord = floor(uv / blockSize) * blockSize;
  if (random(blockCoord + uTime * 10.0) > 0.95) {
    color.rgb = vec3(random(blockCoord), random(blockCoord + 1.0), random(blockCoord + 2.0));
  }
  
  // Scanlines
  float scanline = sin(uv.y * 800.0) * 0.04;
  color.rgb -= scanline * glitchIntensity;
  
  // Apply blur if needed
  if (uBlur > 0.0) {
    vec2 texelSize = 1.0 / uResolution;
    vec4 blur = texture2D(uTexture, uv + vec2(texelSize.x, 0.0) * uBlur * 100.0);
    blur += texture2D(uTexture, uv - vec2(texelSize.x, 0.0) * uBlur * 100.0);
    blur += texture2D(uTexture, uv + vec2(0.0, texelSize.y) * uBlur * 100.0);
    blur += texture2D(uTexture, uv - vec2(0.0, texelSize.y) * uBlur * 100.0);
    blur *= 0.25;
    
    color = mix(color, blur, uBlur);
  }
  
  // Apply opacity
  color.a *= uOpacity;
  
  gl_FragColor = color;
}
`