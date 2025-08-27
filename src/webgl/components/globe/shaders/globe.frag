uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uBumpTexture;
uniform sampler2D uSpecularTexture;
uniform float uTime;
uniform vec3 uSunDirection;
uniform float uShowNightLights;
uniform vec3 uAtmosphereColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;

// Calculate normal from bump map
vec3 perturbNormal(vec3 normal, vec3 viewPos, vec2 uv) {
  vec3 q0 = dFdx(viewPos);
  vec3 q1 = dFdy(viewPos);
  vec2 st0 = dFdx(uv);
  vec2 st1 = dFdy(uv);
  
  float height = texture2D(uBumpTexture, uv).r;
  float scale = 0.05;
  
  vec3 S = normalize(q0 * st1.t - q1 * st0.t);
  vec3 T = normalize(-q0 * st1.s + q1 * st0.s);
  vec3 N = normalize(normal);
  
  vec3 mapN = vec3(dFdx(height), dFdy(height), 0.0) * scale;
  mapN.xy *= -1.0;
  mapN = normalize(mapN);
  
  mat3 tsn = mat3(S, T, N);
  return normalize(tsn * mapN);
}

void main() {
  // Sample textures
  vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
  vec3 nightColor = texture2D(uNightTexture, vUv).rgb;
  float specular = texture2D(uSpecularTexture, vUv).r;
  
  // Perturb normal with bump map
  vec3 normal = perturbNormal(vNormal, vViewPosition, vUv);
  
  // Calculate lighting
  float dotNL = dot(normal, uSunDirection);
  float dayStrength = smoothstep(-0.15, 0.25, dotNL);
  
  // Mix day and night textures
  vec3 color = mix(nightColor * uShowNightLights, dayColor, dayStrength);
  
  // Add specular for water
  if (specular > 0.5) {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    vec3 reflectDir = reflect(-uSunDirection, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 64.0);
    color += vec3(0.5, 0.6, 0.7) * spec * specular * dayStrength;
  }
  
  // Rim lighting for atmosphere effect
  float rimDot = 1.0 - dot(normalize(vViewPosition), normal);
  float rimAmount = smoothstep(0.0, 1.0, rimDot);
  vec3 rimColor = uAtmosphereColor * pow(rimAmount, 2.0) * 0.5;
  
  // Combine everything
  color += rimColor;
  
  // Apply gamma correction
  color = pow(color, vec3(1.0 / 2.2));
  
  gl_FragColor = vec4(color, 1.0);
}