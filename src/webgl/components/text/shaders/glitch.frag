uniform float uTime;
uniform vec2 uMouse;
uniform float uIntensity;
uniform vec3 uColor;

varying vec2 vUv;
varying float vGlitch;
varying float vAlpha;

// Pseudo-random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// RGB shift effect
vec3 rgbShift(vec2 uv, float amount) {
    vec3 color;
    color.r = texture2D(tDiffuse, uv + vec2(amount, 0.0)).r;
    color.g = texture2D(tDiffuse, uv).g;
    color.b = texture2D(tDiffuse, uv - vec2(amount, 0.0)).b;
    return color;
}

void main() {
    vec3 color = uColor;
    
    // Glitch time
    float glitchTime = floor(uTime * 15.0) / 15.0;
    
    // Add RGB channel separation in glitch areas
    if (vGlitch > 0.5) {
        float shift = random(vec2(glitchTime, vUv.y)) * 0.1 * uIntensity;
        color.r = uColor.r * (1.0 + shift);
        color.g = uColor.g * (1.0 - shift * 0.5);
        color.b = uColor.b * (1.0 + shift * 0.3);
    }
    
    // Digital noise
    float noise = random(vec2(vUv * 100.0 + uTime * 10.0)) * 0.1;
    color += noise * vGlitch * uIntensity;
    
    // Scanline effect
    float scanline = sin(vUv.y * 400.0 + uTime * 10.0) * 0.04;
    color -= scanline * vGlitch;
    
    // Color aberration
    float aberration = sin(uTime * 20.0) * 0.1 * uIntensity;
    color.r += aberration * vGlitch;
    color.b -= aberration * vGlitch;
    
    // Mouse glow
    float mouseDistance = distance(vUv, uMouse * 0.5 + 0.5);
    float glow = 1.0 - smoothstep(0.0, 0.3, mouseDistance);
    color += glow * 0.3 * vec3(0.2, 0.6, 1.0);
    
    // Apply alpha
    float alpha = vAlpha;
    
    // Random flicker
    if (random(vec2(glitchTime * 2.0)) > 0.95) {
        alpha *= 0.5 + random(vec2(glitchTime, vUv.x)) * 0.5;
    }
    
    gl_FragColor = vec4(color, alpha);
}