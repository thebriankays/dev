uniform vec3 uAtmosphereColor;
uniform float uIntensity;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float rim = dot(viewDirection, vNormal);
  rim = 1.0 - rim;
  rim = pow(rim, 3.0);
  
  // Add some pulsing animation
  float pulse = sin(uTime * 0.5) * 0.1 + 0.9;
  
  vec3 atmosphereColor = uAtmosphereColor * uIntensity * pulse;
  float alpha = rim * 0.8;
  
  gl_FragColor = vec4(atmosphereColor, alpha);
}