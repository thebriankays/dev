uniform float uTime;
uniform vec2 uMouse;
uniform float uOutlineWidth;
uniform float uPulse;

varying vec2 vUv;
varying float vOutlineFactor;

void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Calculate normal offset for outline
    vec3 outlineOffset = normal * uOutlineWidth;
    
    // Pulsing outline
    float pulse = sin(uTime * uPulse) * 0.5 + 0.5;
    outlineOffset *= 1.0 + pulse * 0.3;
    
    // Mouse interaction affects outline
    float mouseDistance = distance(uv, uMouse * 0.5 + 0.5);
    float mouseInfluence = 1.0 - smoothstep(0.0, 0.5, mouseDistance);
    outlineOffset *= 1.0 + mouseInfluence * 0.5;
    
    // Apply outline
    pos += outlineOffset;
    
    // Wave effect on outline
    float wave = sin(uv.x * 20.0 + uTime * 3.0) * sin(uv.y * 20.0 + uTime * 2.0);
    pos.z += wave * uOutlineWidth * 2.0;
    
    // Store outline factor for fragment shader
    vOutlineFactor = length(outlineOffset) / uOutlineWidth;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}