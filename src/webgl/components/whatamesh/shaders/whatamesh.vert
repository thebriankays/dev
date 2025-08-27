uniform float uTime;
uniform vec2 uMouse;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uFrequency;

varying vec2 vUv;
varying float vDisplacement;
varying vec3 vNormal;
varying vec3 vPosition;

// Simplex 3D noise function
vec4 permute(vec4 x) {
  return mod(((x*34.0)+1.0)*x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  // Permutations
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
           i.z + vec4(0.0, i1.z, i2.z, 1.0))
         + i.y + vec4(0.0, i1.y, i2.y, 1.0))
         + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients: 7x7 points over a square, mapped onto an octahedron
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  // Normalize gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  vUv = uv;
  vec3 pos = position;
  
  // Create flowing noise patterns
  float noiseFreq = uFrequency;
  float noiseAmp = uAmplitude;
  
  // Multi-layered noise for organic movement
  vec3 noisePos = vec3(pos.x * noiseFreq, pos.y * noiseFreq, uTime * uSpeed);
  float noise1 = snoise(noisePos) * 0.5;
  float noise2 = snoise(noisePos * 2.0 + 1000.0) * 0.25;
  float noise3 = snoise(noisePos * 4.0 + 2000.0) * 0.125;
  
  float displacement = (noise1 + noise2 + noise3) * noiseAmp;
  
  // Mouse influence
  vec2 mouseInfluence = (uMouse - 0.5) * 2.0;
  float mouseDistance = distance(uv, vec2(0.5) + mouseInfluence * 0.1);
  float mouseEffect = smoothstep(0.8, 0.0, mouseDistance);
  displacement += mouseEffect * 0.1 * sin(uTime * 2.0);
  
  // Apply displacement to z position
  pos.z += displacement;
  vDisplacement = displacement;
  
  // Calculate normal for lighting
  float delta = 0.01;
  vec3 neighbor1 = vec3(pos.x + delta, pos.y, pos.z);
  vec3 neighbor2 = vec3(pos.x, pos.y + delta, pos.z);
  
  neighbor1.z += snoise(vec3(neighbor1.x * noiseFreq, neighbor1.y * noiseFreq, uTime * uSpeed)) * noiseAmp;
  neighbor2.z += snoise(vec3(neighbor2.x * noiseFreq, neighbor2.y * noiseFreq, uTime * uSpeed)) * noiseAmp;
  
  vec3 tangent = normalize(neighbor1 - pos);
  vec3 bitangent = normalize(neighbor2 - pos);
  vNormal = normalize(cross(tangent, bitangent));
  
  vPosition = pos;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}