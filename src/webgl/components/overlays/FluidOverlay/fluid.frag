uniform float uTime;
uniform sampler2D uFlowmap;
uniform float uIntensity;
uniform vec3 uColor;
uniform vec2 uResolution;

varying vec2 vUv;

// Simple noise function
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  
  // Sample flowmap
  vec4 flow = texture2D(uFlowmap, uv);
  
  // Create fluid distortion
  vec2 distortion = flow.rg * 2.0 - 1.0;
  distortion *= uIntensity;
  
  // Apply time-based animation
  float wave = sin(uTime * 2.0 + uv.x * 10.0) * 0.1;
  wave += sin(uTime * 1.5 + uv.y * 8.0) * 0.05;
  
  // Combine distortions
  uv += distortion * 0.1;
  uv += wave * distortion.y * 0.05;
  
  // Create fluid pattern
  float pattern = 0.0;
  for (float i = 1.0; i <= 3.0; i++) {
    vec2 pos = uv * i + uTime * 0.1 * i;
    pattern += noise(pos) / i;
  }
  
  // Apply color and intensity
  vec3 color = uColor * pattern * flow.b;
  float alpha = pattern * uIntensity * flow.a;
  
  // Edge fade
  float edgeFade = 1.0 - smoothstep(0.4, 0.5, length(vUv - 0.5));
  alpha *= edgeFade;
  
  gl_FragColor = vec4(color, alpha);
}