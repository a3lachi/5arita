// Custom shader for realistic star rendering with glow effect

export const starVertexShader = `
  attribute float size;
  attribute vec3 color;

  varying vec3 vColor;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const starFragmentShader = `
  varying vec3 vColor;

  void main() {
    // Calculate distance from center (0.5, 0.5)
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    // Create a soft circular gradient
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);

    // Add bright core
    float core = 1.0 - smoothstep(0.0, 0.15, dist);

    // Add glow halo
    float glow = 1.0 - smoothstep(0.15, 0.5, dist);

    // Combine core and glow with color
    vec3 finalColor = vColor * (core * 2.0 + glow * 0.8);

    // Add extra brightness to the center
    finalColor += core * 0.5;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
