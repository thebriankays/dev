varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vPosition = modelPosition.xyz;
  
  vec4 viewPosition = viewMatrix * modelPosition;
  vViewPosition = viewPosition.xyz;
  
  gl_Position = projectionMatrix * viewPosition;
}