uniform float uTime;
uniform vec3 uColor;
uniform float uProgress;
uniform sampler2D uTexture;

varying vec2 vUv;
varying float vAlpha;
varying float vRandom;

void main() {
    // Create circular particles
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    // Soft edges
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    alpha *= vAlpha;
    
    // Color variation
    vec3 color = uColor;
    
    // Add color gradient based on randomness
    vec3 color1 = uColor;
    vec3 color2 = uColor * 1.5;
    vec3 color3 = vec3(uColor.r * 0.8, uColor.g * 1.2, uColor.b * 1.1);
    
    if (vRandom < 0.33) {
        color = mix(color1, color2, vRandom * 3.0);
    } else if (vRandom < 0.66) {
        color = mix(color2, color3, (vRandom - 0.33) * 3.0);
    } else {
        color = mix(color3, color1, (vRandom - 0.66) * 3.0);
    }
    
    // Sparkle effect
    float sparkle = sin(uTime * 10.0 + vRandom * 100.0) * 0.5 + 0.5;
    color += sparkle * 0.2 * uProgress;
    
    // Glow effect
    float glow = exp(-dist * 3.0);
    color += glow * 0.3;
    
    gl_FragColor = vec4(color, alpha);
}