uniform float uTime;
uniform float uMorphProgress;
uniform vec2 uMouse;
uniform float uTwist;
uniform float uBend;

attribute vec3 aTargetPosition;
attribute vec3 aRandomPosition;

varying vec2 vUv;
varying float vProgress;
varying float vDistortion;

// Rotation matrix functions
mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

void main() {
    vUv = uv;
    vProgress = uMorphProgress;
    
    // Smoothstep for easing
    float progress = smoothstep(0.0, 1.0, uMorphProgress);
    
    // Mix between positions
    vec3 morphedPosition = mix(position, aTargetPosition, progress);
    
    // Add random displacement during transition
    vec3 randomDisplacement = aRandomPosition * (1.0 - abs(progress - 0.5) * 2.0);
    morphedPosition += randomDisplacement * 0.3;
    
    // Twist effect
    float twistAngle = uTwist * (1.0 - abs(progress - 0.5) * 2.0);
    mat4 twist = rotationMatrix(vec3(0.0, 1.0, 0.0), twistAngle * morphedPosition.y * 0.01);
    morphedPosition = (twist * vec4(morphedPosition, 1.0)).xyz;
    
    // Bend effect
    float bendAmount = uBend * (1.0 - abs(progress - 0.5) * 2.0);
    morphedPosition.y += sin(morphedPosition.x * 0.1) * bendAmount;
    morphedPosition.z += cos(morphedPosition.x * 0.1) * bendAmount * 0.5;
    
    // Mouse interaction
    float mouseDistance = distance(uv, uMouse * 0.5 + 0.5);
    float mouseInfluence = 1.0 - smoothstep(0.0, 0.5, mouseDistance);
    vec3 mouseOffset = vec3(uMouse * mouseInfluence, 0.0) * 20.0;
    morphedPosition += mouseOffset * (1.0 - abs(progress - 0.5) * 2.0);
    
    // Wave distortion during morph
    float wave = sin(uv.x * 10.0 + uTime * 3.0) * sin(uv.y * 10.0 + uTime * 2.0);
    morphedPosition.z += wave * 10.0 * (1.0 - abs(progress - 0.5) * 2.0);
    
    vDistortion = length(morphedPosition - position) * 0.1;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(morphedPosition, 1.0);
}