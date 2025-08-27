uniform float uTime;
uniform float uWaveFrequency;
uniform float uWaveAmplitude;
uniform vec2 uMouse;
uniform float uSpeed;

varying vec2 vUv;
varying float vWave;
varying float vElevation;

void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Multiple wave layers for complex motion
    float wave1 = sin(uv.x * uWaveFrequency + uTime * uSpeed) * uWaveAmplitude;
    float wave2 = sin(uv.y * uWaveFrequency * 0.7 + uTime * uSpeed * 1.3) * uWaveAmplitude * 0.5;
    float wave3 = sin((uv.x + uv.y) * uWaveFrequency * 0.5 + uTime * uSpeed * 0.8) * uWaveAmplitude * 0.3;
    
    // Combine waves
    float totalWave = wave1 + wave2 + wave3;
    
    // Apply wave to position
    pos.z += totalWave * 50.0;
    pos.y += totalWave * 10.0;
    
    // Mouse influence creates ripple effect
    float mouseDistance = distance(uv, uMouse * 0.5 + 0.5);
    float ripple = sin(mouseDistance * 20.0 - uTime * 10.0) * exp(-mouseDistance * 3.0);
    pos.z += ripple * 30.0;
    
    // Store wave data for fragment shader
    vWave = totalWave;
    vElevation = pos.z / 100.0;
    
    // Subtle rotation based on wave
    float angle = totalWave * 0.1;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    pos.xy = rot * pos.xy;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}