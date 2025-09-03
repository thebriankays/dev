// Fragment shader for Whatamesh background gradient
// Based on Stripe's WebGL gradient animation

precision highp float;

uniform vec2 resolution;
uniform float u_darken_top;
uniform float u_shadow_power;

varying vec3 v_color;

void main() {
  vec3 color = v_color;
  
  // Darken top effect (optional)
  if (u_darken_top == 1.0) {
    vec2 st = gl_FragCoord.xy / resolution.xy;
    color.g -= pow(st.y + sin(-12.0) * st.x, u_shadow_power) * 0.4;
  }
  
  gl_FragColor = vec4(color, 1.0);
}