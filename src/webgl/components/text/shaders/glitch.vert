uniform float uTime;
uniform float uIntensity;
uniform vec2 uMouse;
uniform float uGlitchAmount;

varying vec2 vUv;
varying float vGlitch;
varying float vAlpha;

// Pseudo-random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Noise function
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Glitch time intervals
    float glitchTime = floor(uTime * 10.0) / 10.0;
    float glitchStrength = random(vec2(glitchTime)) * uGlitchAmount;
    
    // RGB channel split
    float rgbOffset = glitchStrength * 20.0;
    float channelOffset = random(vec2(glitchTime, 1.0)) * rgbOffset;
    
    // Horizontal glitch displacement
    if (random(vec2(glitchTime, uv.y)) > 0.95) {
        pos.x += random(vec2(glitchTime, uv.y * 10.0)) * rgbOffset - rgbOffset * 0.5;
        vGlitch = 1.0;
    } else {
        vGlitch = 0.0;
    }
    
    // Vertical jitter
    if (random(vec2(glitchTime * 2.0, 0.0)) > 0.9) {
        pos.y += noise(vec2(uTime * 50.0, uv.x * 10.0)) * glitchStrength * 10.0;
    }
    
    // Z-axis glitch for depth
    pos.z += noise(vec2(uTime * 20.0, uv.y * 5.0)) * glitchStrength * 30.0;
    
    // Mouse interaction
    float mouseDistance = distance(uv, uMouse * 0.5 + 0.5);
    float mouseInfluence = smoothstep(0.5, 0.0, mouseDistance);
    pos.xy += uMouse * mouseInfluence * 10.0 * (1.0 + glitchStrength);
    
    // Alpha variations
    vAlpha = 1.0 - glitchStrength * 0.3 * random(vec2(glitchTime, uv.x));
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}