uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uColor;
uniform float uOpacity;

varying vec2 vUv;
varying float vWave;
varying float vElevation;

void main() {
    vec3 color = uColor;
    
    // Color gradient based on wave elevation
    vec3 lowColor = uColor * 0.8;
    vec3 highColor = uColor * 1.2;
    color = mix(lowColor, highColor, vElevation + 0.5);
    
    // Add iridescent effect
    float iridescence = sin(vWave * 10.0 + uTime * 2.0) * 0.2;
    color.r += iridescence;
    color.b -= iridescence * 0.5;
    
    // Fresnel-like edge glow
    float fresnel = pow(1.0 - abs(vElevation), 2.0);
    color += fresnel * 0.3;
    
    // Mouse interaction creates color shift
    float mouseDistance = distance(vUv, uMouse * 0.5 + 0.5);
    float mouseInfluence = 1.0 - smoothstep(0.0, 0.5, mouseDistance);
    vec3 mouseColor = vec3(0.3, 0.6, 1.0);
    color = mix(color, mouseColor, mouseInfluence * 0.3);
    
    // Subtle animation
    float pulse = sin(uTime * 3.0 + vWave * 5.0) * 0.1 + 0.9;
    color *= pulse;
    
    // Alpha based on wave position
    float alpha = uOpacity * (0.8 + vWave * 0.2);
    
    gl_FragColor = vec4(color, alpha);
}