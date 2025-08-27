export const distortionVertex = `
uniform float uTime;
uniform float uProgress;
uniform float uTransition;
uniform float uDistortion;
uniform vec2 uMouse;
uniform float uParallax;

varying vec2 vUv;
varying float vDistortion;

// Simplex noise for smooth distortion
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vUv = uv;
  
  vec3 pos = position;
  
  // Complex distortion pattern
  float noiseScale = 3.0;
  float distortion = snoise(uv * noiseScale + uTime * 0.5);
  distortion += snoise(uv * noiseScale * 2.0 - uTime * 0.3) * 0.5;
  distortion += snoise(uv * noiseScale * 4.0 + uTime * 0.2) * 0.25;
  
  // Apply transition-based distortion
  float distortAmount = uTransition * 100.0 * (1.0 + uDistortion);
  
  // Twist effect
  float twist = uTransition * 3.14159;
  float s = sin(twist * uv.y);
  float c = cos(twist * uv.y);
  mat2 twistMat = mat2(c, -s, s, c);
  pos.xy = twistMat * pos.xy;
  
  // Apply noise distortion
  pos.xy += vec2(distortion) * distortAmount;
  pos.z += distortion * distortAmount * 0.5;
  
  vDistortion = distortion;
  
  // Parallax
  pos.xy += uMouse * uParallax * 100.0;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

export const distortionFragment = `
uniform sampler2D uTexture;
uniform float uTime;
uniform float uProgress;
uniform float uTransition;
uniform float uOpacity;
uniform float uBlur;
uniform vec2 uResolution;

varying vec2 vUv;
varying float vDistortion;

void main() {
  vec2 uv = vUv;
  
  // Distort UV coordinates
  vec2 distortedUv = uv;
  distortedUv.x += sin(uv.y * 10.0 + uTime) * 0.01 * uTransition;
  distortedUv.y += cos(uv.x * 10.0 + uTime) * 0.01 * uTransition;
  
  // Add chromatic aberration
  float aberration = uTransition * 0.01;
  vec2 redOffset = vec2(aberration, 0.0);
  vec2 blueOffset = vec2(-aberration, 0.0);
  
  float r = texture2D(uTexture, distortedUv + redOffset).r;
  float g = texture2D(uTexture, distortedUv).g;
  float b = texture2D(uTexture, distortedUv + blueOffset).b;
  
  vec4 color = vec4(r, g, b, 1.0);
  
  // Apply blur
  if (uBlur > 0.0) {
    vec2 texelSize = 1.0 / uResolution;
    vec4 blur = vec4(0.0);
    float kernel[9];
    kernel[0] = 0.0625; kernel[1] = 0.125; kernel[2] = 0.0625;
    kernel[3] = 0.125;  kernel[4] = 0.25;  kernel[5] = 0.125;
    kernel[6] = 0.0625; kernel[7] = 0.125; kernel[8] = 0.0625;
    
    int index = 0;
    for(int x = -1; x <= 1; x++) {
      for(int y = -1; y <= 1; y++) {
        vec2 offset = vec2(float(x), float(y)) * texelSize * uBlur * 100.0;
        blur += texture2D(uTexture, uv + offset) * kernel[index];
        index++;
      }
    }
    
    color = mix(color, blur, uBlur);
  }
  
  // Distortion-based color shift
  color.rgb = mix(color.rgb, vec3(1.0, 0.5, 0.8), abs(vDistortion) * 0.1 * uTransition);
  
  // Apply opacity
  color.a *= uOpacity;
  
  gl_FragColor = color;
}
`