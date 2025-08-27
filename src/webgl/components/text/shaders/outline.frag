uniform float uTime;
uniform vec3 uColor;
uniform vec3 uOutlineColor;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uGlow;

varying vec2 vUv;
varying float vOutlineFactor;

void main() {
    vec3 color = uColor;
    
    // Create outline gradient
    float outlineStrength = smoothstep(0.0, 1.0, vOutlineFactor);
    color = mix(uColor, uOutlineColor, outlineStrength);
    
    // Glow effect
    float glow = exp(-vOutlineFactor * 2.0) * uGlow;
    color += uOutlineColor * glow;
    
    // Animated gradient along outline
    float gradientAnimation = sin(vUv.x * 10.0 + uTime * 2.0) * 0.5 + 0.5;
    vec3 gradientColor = mix(uOutlineColor, vec3(1.0), gradientAnimation * outlineStrength);
    color = mix(color, gradientColor, 0.3);
    
    // Mouse highlight
    float mouseDistance = distance(vUv, uMouse * 0.5 + 0.5);
    float mouseGlow = 1.0 - smoothstep(0.0, 0.3, mouseDistance);
    color += mouseGlow * 0.5 * vec3(0.3, 0.6, 1.0);
    
    // Shimmer effect
    float shimmer = sin(uTime * 10.0 + vUv.x * 50.0) * sin(uTime * 7.0 + vUv.y * 30.0);
    color += shimmer * 0.1 * outlineStrength;
    
    // Alpha
    float alpha = uOpacity;
    alpha *= 0.6 + outlineStrength * 0.4;
    
    gl_FragColor = vec4(color, alpha);
}