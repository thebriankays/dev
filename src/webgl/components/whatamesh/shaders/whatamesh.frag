uniform float uTime;
uniform vec3 uColorStart;
uniform vec3 uColorEnd;
uniform vec3 uColorAccent;
uniform vec2 uMouse;
uniform float uOpacity;
uniform float uGradientSpeed;

varying vec2 vUv;
varying float vDisplacement;
varying vec3 vNormal;
varying vec3 vPosition;

// Smooth HSB to RGB conversion
vec3 hsb2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
  rgb = rgb*rgb*(3.0-2.0*rgb);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

void main() {
  // Create animated gradient
  float gradientTime = uTime * uGradientSpeed;
  float gradientOffset = sin(gradientTime) * 0.5 + 0.5;
  
  // Calculate gradient position with displacement influence
  float gradientPosition = vUv.y + vDisplacement * 0.5;
  gradientPosition += sin(vUv.x * 3.0 + gradientTime) * 0.1;
  
  // Mix three colors for richer gradients
  vec3 color1 = uColorStart;
  vec3 color2 = uColorEnd;
  vec3 color3 = uColorAccent;
  
  // Create color stops
  float colorMix1 = smoothstep(0.0, 0.5, gradientPosition + gradientOffset * 0.5);
  float colorMix2 = smoothstep(0.3, 0.7, gradientPosition + gradientOffset * 0.3);
  
  vec3 baseColor = mix(color1, color2, colorMix1);
  baseColor = mix(baseColor, color3, colorMix2 * 0.5);
  
  // Add iridescence based on viewing angle
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float fresnel = 1.0 - dot(viewDirection, vNormal);
  fresnel = pow(fresnel, 2.0);
  
  // Create iridescent colors
  float iridescenceAngle = atan(vNormal.y, vNormal.x) + gradientTime * 0.5;
  vec3 iridescence = hsb2rgb(vec3(
    iridescenceAngle / (2.0 * 3.14159) + 0.5,
    0.7,
    1.0
  ));
  
  // Mix iridescence with base color
  vec3 finalColor = mix(baseColor, iridescence, fresnel * 0.3);
  
  // Add subtle lighting based on displacement
  float lighting = vDisplacement * 0.5 + 0.5;
  finalColor *= 0.8 + lighting * 0.4;
  
  // Mouse highlight
  vec2 mouseDistance = abs(vUv - vec2(0.5) - (uMouse - 0.5) * 0.2);
  float mouseGlow = 1.0 - smoothstep(0.0, 0.5, length(mouseDistance));
  finalColor += mouseGlow * 0.2 * color3;
  
  // Add subtle noise texture
  float noise = fract(sin(dot(vUv.xy, vec2(12.9898, 78.233))) * 43758.5453);
  finalColor += noise * 0.02;
  
  // Apply opacity with soft edges
  float edgeFade = 1.0;
  float edgeDistance = min(
    min(vUv.x, 1.0 - vUv.x),
    min(vUv.y, 1.0 - vUv.y)
  );
  edgeFade = smoothstep(0.0, 0.1, edgeDistance);
  
  gl_FragColor = vec4(finalColor, uOpacity * edgeFade);
}