uniform sampler2D uTexture;
uniform float uOpacity;
uniform float uDepthFade;
uniform float uTime;
uniform float uHover;
uniform vec2 uResolution;
uniform float uReflection;

varying vec2 vUv;
varying float vDepth;
varying vec3 vPosition;

void main() {
  vec4 texture = texture2D(uTexture, vUv);
  
  // Apply depth-based fading
  float depthFade = mix(1.0, 0.3, vDepth * uDepthFade);
  
  // Add subtle hover glow
  float glow = 0.0;
  if (uHover > 0.0) {
    vec2 center = vUv - 0.5;
    float dist = length(center);
    glow = (1.0 - dist) * uHover * 0.3;
  }
  
  // Reflection effect (for ground plane reflections)
  float reflectionAlpha = 1.0;
  if (uReflection > 0.0) {
    reflectionAlpha = mix(1.0, 0.0, vUv.y * uReflection);
  }
  
  // Final color with depth fade and hover effects
  vec3 finalColor = texture.rgb + vec3(glow);
  float finalAlpha = texture.a * uOpacity * depthFade * reflectionAlpha;
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}