varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;

uniform float uTime;
uniform float uIntensity;
uniform float uThickness;
uniform float uRoughness;
uniform float uTransmission;
uniform float uIOR;
uniform float uChromaticAberration;
uniform float uDistortion;
uniform vec2 uResolution;
uniform sampler2D uBackgroundTexture;

// Fresnel function
float fresnel(vec3 viewDirection, vec3 normal, float ior) {
  float cosi = clamp(dot(viewDirection, normal), -1.0, 1.0);
  float etai = 1.0;
  float etat = ior;
  
  if (cosi > 0.0) {
    float temp = etai;
    etai = etat;
    etat = temp;
  }
  
  float sint = etai / etat * sqrt(max(0.0, 1.0 - cosi * cosi));
  
  if (sint >= 1.0) {
    return 1.0;
  }
  
  float cost = sqrt(max(0.0, 1.0 - sint * sint));
  cosi = abs(cosi);
  float Rs = ((etat * cosi) - (etai * cost)) / ((etat * cosi) + (etai * cost));
  float Rp = ((etai * cosi) - (etat * cost)) / ((etai * cosi) + (etat * cost));
  
  return (Rs * Rs + Rp * Rp) / 2.0;
}

// Simple noise function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  
  // Calculate fresnel
  float fresnelFactor = fresnel(viewDirection, normal, uIOR);
  
  // Base glass color with slight tint
  vec3 glassColor = vec3(0.9, 0.95, 1.0);
  
  // Calculate refraction with chromatic aberration
  vec2 screenUV = gl_FragCoord.xy / uResolution;
  
  // Distort UV based on normal and time
  vec2 distortedUV = screenUV;
  if (uDistortion > 0.0) {
    float distortionX = sin(vUv.y * 10.0 + uTime * 2.0) * uDistortion * 0.01;
    float distortionY = cos(vUv.x * 8.0 + uTime * 1.5) * uDistortion * 0.01;
    distortedUV += vec2(distortionX, distortionY);
  }
  
  // Chromatic aberration
  vec3 refractedColor = vec3(1.0);
  if (uChromaticAberration > 0.0) {
    float aberration = uChromaticAberration * (1.0 - fresnelFactor);
    refractedColor.r = texture2D(uBackgroundTexture, distortedUV + vec2(aberration, 0.0)).r;
    refractedColor.g = texture2D(uBackgroundTexture, distortedUV).g;
    refractedColor.b = texture2D(uBackgroundTexture, distortedUV - vec2(aberration, 0.0)).b;
  } else if (uBackgroundTexture != null) {
    refractedColor = texture2D(uBackgroundTexture, distortedUV).rgb;
  }
  
  // Add some surface roughness simulation
  float roughnessNoise = random(vUv + uTime * 0.1) * uRoughness;
  vec3 roughnessColor = mix(glassColor, refractedColor, 1.0 - roughnessNoise);
  
  // Mix refraction and reflection based on fresnel
  vec3 finalColor = mix(roughnessColor, glassColor, fresnelFactor);
  
  // Add glass thickness effect
  float thickness = uThickness * (1.0 + sin(vUv.y * 5.0 + uTime) * 0.1);
  finalColor = mix(finalColor, glassColor * 0.8, thickness);
  
  // Calculate alpha with transmission
  float alpha = mix(1.0 - uTransmission, 0.3, fresnelFactor);
  alpha *= uIntensity;
  
  // Add subtle iridescence
  float iridescence = sin(vUv.x * 20.0 + uTime) * sin(vUv.y * 15.0 + uTime * 1.3) * 0.1;
  finalColor += vec3(iridescence * 0.2, iridescence * 0.1, iridescence * 0.3) * uIntensity;
  
  gl_FragColor = vec4(finalColor, alpha);
}