uniform float uTime;
uniform vec2 uPointer;
uniform vec2 uVelocity;
uniform sampler2D uPrevious;
uniform float uAspect;
uniform float uFalloff;
uniform float uAlpha;
uniform float uDissipation;

varying vec2 vUv;

float distanceToSegment(vec2 a, vec2 b, vec2 p) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 aspectUv = vUv;
  aspectUv.x *= uAspect;
  
  vec2 pointerAspect = uPointer;
  pointerAspect.x *= uAspect;
  
  vec2 prevPointerAspect = uPointer - uVelocity * 0.1;
  prevPointerAspect.x *= uAspect;
  
  // Calculate distance to pointer trail
  float distance = distanceToSegment(prevPointerAspect, pointerAspect, aspectUv);
  
  // Create falloff
  float influence = smoothstep(uFalloff, 0.0, distance);
  influence *= uAlpha;
  
  // Sample previous frame
  vec4 previous = texture2D(uPrevious, vUv);
  
  // Apply dissipation
  previous.rgb *= uDissipation;
  
  // Add new influence
  vec3 color = vec3(influence);
  color = mix(previous.rgb, color, influence);
  
  // Add velocity information to RG channels
  color.rg += uVelocity * influence * 0.1;
  
  gl_FragColor = vec4(color, 1.0);
}