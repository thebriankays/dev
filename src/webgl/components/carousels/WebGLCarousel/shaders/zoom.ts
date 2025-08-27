export const zoomVertex = `
uniform float uTime;
uniform float uProgress;
uniform float uTransition;
uniform vec2 uMouse;
uniform float uParallax;
uniform float uScale;

varying vec2 vUv;
varying float vScale;

void main() {
  vUv = uv;
  
  vec3 pos = position;
  
  // Calculate zoom scale
  float zoomScale = 1.0 + uTransition * 2.0;
  vScale = zoomScale;
  
  // Apply zoom from center
  vec2 center = vec2(0.5);
  vec2 fromCenter = uv - center;
  
  // Scale position
  pos.xy *= zoomScale;
  
  // Add rotation during zoom
  float rotation = uTransition * 0.5;
  mat2 rot = mat2(
    cos(rotation), -sin(rotation),
    sin(rotation), cos(rotation)
  );
  pos.xy = rot * pos.xy;
  
  // Parallax effect
  pos.xy += uMouse * uParallax * 100.0 * (1.0 + uTransition);
  
  // Z-depth animation
  pos.z += uTransition * 300.0;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

export const zoomFragment = `
uniform sampler2D uTexture;
uniform float uTime;
uniform float uProgress;
uniform float uTransition;
uniform float uOpacity;
uniform float uBlur;
uniform vec2 uResolution;

varying vec2 vUv;
varying float vScale;

void main() {
  vec2 uv = vUv;
  
  // Zoom blur effect - sample from zoomed coordinates
  vec2 center = vec2(0.5);
  vec2 toCenter = center - uv;
  
  vec4 color = vec4(0.0);
  float total = 0.0;
  
  // Radial blur
  float blurAmount = uTransition * 0.05;
  
  for(float i = 0.0; i < 10.0; i += 1.0) {
    float percent = i / 10.0;
    vec2 sampleUv = uv + toCenter * percent * blurAmount;
    color += texture2D(uTexture, sampleUv);
    total += 1.0;
  }
  
  color /= total;
  
  // Apply additional blur if needed
  if (uBlur > 0.0) {
    vec2 texelSize = 1.0 / uResolution;
    vec4 blur = vec4(0.0);
    
    for(float i = -1.0; i <= 1.0; i += 1.0) {
      for(float j = -1.0; j <= 1.0; j += 1.0) {
        vec2 offset = vec2(i, j) * texelSize * uBlur * 100.0;
        blur += texture2D(uTexture, uv + offset);
      }
    }
    
    color = mix(color, blur / 9.0, uBlur);
  }
  
  // Vignette effect during zoom
  float vignette = smoothstep(0.0, 1.0, distance(uv, center));
  color.rgb *= 1.0 - vignette * uTransition * 0.5;
  
  // Brightness based on scale
  color.rgb *= 1.0 + uTransition * 0.3;
  
  // Apply opacity with fade
  color.a *= uOpacity * (1.0 - uTransition * 0.3);
  
  gl_FragColor = color;
}
`