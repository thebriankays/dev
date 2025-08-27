uniform float uTime;
uniform float uProgress;
uniform vec2 uMouse;
uniform float uDispersion;
uniform sampler2D uTexture;

attribute float aRandom;
attribute vec3 aTarget;

varying vec2 vUv;
varying float vAlpha;
varying float vRandom;

void main() {
    vUv = uv;
    vRandom = aRandom;
    
    vec3 pos = position;
    
    // Particle dispersion effect
    vec3 dispersed = position;
    dispersed += (aTarget - position) * uProgress;
    
    // Add randomness to particle movement
    float randomOffset = aRandom * 2.0 - 1.0;
    dispersed.x += sin(uTime * 2.0 + aRandom * 10.0) * randomOffset * uDispersion * (1.0 - uProgress);
    dispersed.y += cos(uTime * 1.5 + aRandom * 10.0) * randomOffset * uDispersion * (1.0 - uProgress);
    dispersed.z += sin(uTime * 3.0 + aRandom * 5.0) * randomOffset * uDispersion * 0.5;
    
    // Mouse repulsion
    vec2 mousePos = uMouse * 0.5 + 0.5;
    float mouseDistance = distance(uv, mousePos);
    float mouseForce = 1.0 - smoothstep(0.0, 0.3, mouseDistance);
    vec2 mouseDirection = normalize(uv - mousePos);
    dispersed.xy += mouseDirection * mouseForce * 50.0 * (1.0 - uProgress);
    
    // Scale particles based on progress
    float scale = mix(0.5, 1.0, uProgress);
    scale *= 1.0 + sin(uTime * 4.0 + aRandom * 20.0) * 0.1;
    
    // Rotation for visual interest
    float angle = uTime * aRandom + uProgress * 3.14159;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    dispersed.xy = rot * dispersed.xy * scale;
    
    // Alpha fading
    vAlpha = uProgress * (0.5 + aRandom * 0.5);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(dispersed, 1.0);
    gl_PointSize = mix(2.0, 8.0, uProgress) * (1.0 + aRandom);
}