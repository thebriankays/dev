uniform float uTime;
uniform vec3 uColor;
uniform vec3 uTargetColor;
uniform float uMorphProgress;
uniform float uOpacity;

varying vec2 vUv;
varying float vProgress;
varying float vDistortion;

void main() {
    // Mix between colors
    vec3 color = mix(uColor, uTargetColor, vProgress);
    
    // Add distortion-based color variation
    vec3 distortionColor = vec3(
        color.r + vDistortion * 0.3,
        color.g - vDistortion * 0.2,
        color.b + vDistortion * 0.4
    );
    color = mix(color, distortionColor, vDistortion);
    
    // Energy effect during morph
    float energy = 1.0 - abs(vProgress - 0.5) * 2.0;
    vec3 energyColor = vec3(0.3, 0.6, 1.0);
    color = mix(color, energyColor, energy * 0.3);
    
    // Glow effect at transition midpoint
    float midGlow = exp(-abs(vProgress - 0.5) * 10.0);
    color += midGlow * 0.5;
    
    // Pulsing brightness
    float pulse = sin(uTime * 4.0 + vProgress * 3.14159) * 0.1 + 0.9;
    color *= pulse;
    
    // Edge fade based on UV
    float edgeFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
    edgeFade *= smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
    
    // Alpha calculation
    float alpha = uOpacity * edgeFade;
    alpha *= 0.7 + energy * 0.3; // More transparent during transition
    
    gl_FragColor = vec4(color, alpha);
}