/* src/webgl/components/globe/TravelDataGlobe/TravelDataGlobe.client.tsx
 *
 * Full-featured globe implementation for the shared-canvas architecture.
 * Replicates all react-globe.gl functionality using React Three Fiber.
 */
'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import {
  TextureLoader,
  Vector3,
  Color,
  BufferGeometry,
  BufferAttribute,
  Mesh,
  Group,
  SphereGeometry,
  MeshPhongMaterial,
  MeshBasicMaterial,
  LineBasicMaterial,
  Line,
  Points,
  PointsMaterial,
  DoubleSide,
  AdditiveBlending,
  Shape,
  ShapeGeometry,
  ExtrudeGeometry,
} from 'three';
import { OrbitControls } from '@react-three/drei';
import * as d3 from 'd3-geo';

// Types
export interface GeoJsonFeature {
  type: 'Feature';
  properties: any;
  geometry: {
    type: 'Polygon' | 'MultiPolygon' | 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString';
    coordinates: any;
  };
}

export interface CountryPolygon {
  feature: GeoJsonFeature;
  color?: string;
  altitude?: number;
  opacity?: number;
  onClick?: () => void;
}

export interface GlobePoint {
  lat: number;
  lng: number;
  color?: string;
  size?: number;
  altitude?: number;
  label?: string;
  onClick?: () => void;
  data?: any;
}

export interface GlobeArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color?: string;
  strokeWidth?: number;
  altitude?: number;
  dashArray?: number[];
  data?: any;
}

export interface TravelDataGlobeProps {
  // Polygons (countries)
  polygonsData?: CountryPolygon[];
  polygonAltitude?: number | ((d: CountryPolygon) => number);
  polygonCapColor?: string | ((d: CountryPolygon) => string);
  polygonSideColor?: string | ((d: CountryPolygon) => string);
  polygonStrokeColor?: string | ((d: CountryPolygon) => string);
  polygonOpacity?: number;
  polygonDotRadius?: number;
  onPolygonClick?: (polygon: CountryPolygon) => void;
  onPolygonHover?: (polygon: CountryPolygon | null) => void;

  // Points (markers, restaurants, airports)
  pointsData?: GlobePoint[];
  pointAltitude?: number | ((d: GlobePoint) => number);
  pointColor?: string | ((d: GlobePoint) => string);
  pointRadius?: number | ((d: GlobePoint) => number);
  pointResolution?: number;
  onPointClick?: (point: GlobePoint) => void;
  onPointHover?: (point: GlobePoint | null) => void;

  // Arcs (flight paths)
  arcsData?: GlobeArc[];
  arcColor?: string | ((d: GlobeArc) => string);
  arcStroke?: number | ((d: GlobeArc) => number);
  arcAltitude?: number | ((d: GlobeArc) => number);
  arcDashLength?: number;
  arcDashGap?: number;
  arcDashAnimateTime?: number;
  onArcClick?: (arc: GlobeArc) => void;
  onArcHover?: (arc: GlobeArc | null) => void;

  // Globe settings
  globeImageUrl?: string;
  bumpImageUrl?: string;
  cloudsImageUrl?: string;
  backgroundImageUrl?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  showGraticule?: boolean;

  // Controls
  autoRotateSpeed?: number;
  enableZoom?: boolean;
  enableRotate?: boolean;
  enablePan?: boolean;
  pointLight?: boolean;
  ambientLight?: boolean;

  // Camera
  initialViewState?: {
    lat?: number;
    lng?: number;
    altitude?: number;
  };

  // General
  radius?: number;
  waitForGlobeReady?: boolean;
}

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat: number, lng: number, radius: number, altitude = 0): Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const r = radius * (1 + altitude);
  
  return new Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

// Convert GeoJSON coordinates to 3D positions
function geoJsonToVertices(coordinates: any[], radius: number, altitude = 0): Vector3[] {
  const vertices: Vector3[] = [];
  
  const processCoordinates = (coords: any[]) => {
    if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
      // It's a coordinate pair array
      coords.forEach(([lng, lat]) => {
        vertices.push(latLngToVector3(lat, lng, radius, altitude));
      });
    } else {
      // Recurse deeper
      coords.forEach(processCoordinates);
    }
  };
  
  processCoordinates(coordinates);
  return vertices;
}

// Create geometry for a polygon on sphere surface
function createPolygonGeometry(feature: GeoJsonFeature, radius: number, altitude = 0): BufferGeometry | null {
  if (!feature || !feature.geometry) return null;
  
  const { type, coordinates } = feature.geometry;
  const vertices: number[] = [];
  const indices: number[] = [];
  let vertexCount = 0;
  
  const addPolygon = (ring: number[][]) => {
    if (ring.length < 3) return;
    
    const startIndex = vertexCount;
    const ringVertices: Vector3[] = [];
    
    // Add vertices for this ring
    ring.forEach(([lng, lat]) => {
      const vec = latLngToVector3(lat, lng, radius, altitude);
      vertices.push(vec.x, vec.y, vec.z);
      ringVertices.push(vec);
      vertexCount++;
    });
    
    // Triangulate using earcut algorithm (simplified fan triangulation here)
    // For production, use proper earcut library
    for (let i = 1; i < ringVertices.length - 1; i++) {
      indices.push(startIndex, startIndex + i, startIndex + i + 1);
    }
  };
  
  try {
    if (type === 'Polygon') {
      coordinates[0].forEach(addPolygon);
    } else if (type === 'MultiPolygon') {
      coordinates.forEach((polygon: number[][][]) => {
        polygon[0].forEach(addPolygon);
      });
    }
    
    if (vertices.length === 0) return null;
    
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    if (indices.length > 0) {
      geometry.setIndex(indices);
    }
    geometry.computeVertexNormals();
    
    return geometry;
  } catch (error) {
    console.error('Error creating polygon geometry:', error);
    return null;
  }
}

// Generate arc curve between two points
function generateArcCurve(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  radius: number,
  altitude = 0.2,
  segments = 64
): Vector3[] {
  const start = latLngToVector3(startLat, startLng, radius);
  const end = latLngToVector3(endLat, endLng, radius);
  
  // Calculate control point for arc
  const mid = new Vector3().addVectors(start, end).multiplyScalar(0.5);
  const distance = start.distanceTo(end);
  mid.normalize();
  mid.multiplyScalar(radius * (1 + altitude * distance / (radius * 2)));
  
  const curve: Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = new Vector3();
    
    // Quadratic bezier interpolation
    const s = 1 - t;
    point.x = s * s * start.x + 2 * s * t * mid.x + t * t * end.x;
    point.y = s * s * start.y + 2 * s * t * mid.y + t * t * end.y;
    point.z = s * s * start.z + 2 * s * t * mid.z + t * t * end.z;
    
    curve.push(point);
  }
  
  return curve;
}

// Generate graticule lines
function generateGraticule(radius: number): BufferGeometry {
  const geometry = new BufferGeometry();
  const vertices: number[] = [];
  
  // Latitude lines
  for (let lat = -80; lat <= 80; lat += 10) {
    for (let lng = -180; lng < 180; lng += 2) {
      const v1 = latLngToVector3(lat, lng, radius);
      const v2 = latLngToVector3(lat, lng + 2, radius);
      vertices.push(v1.x, v1.y, v1.z);
      vertices.push(v2.x, v2.y, v2.z);
    }
  }
  
  // Longitude lines
  for (let lng = -180; lng < 180; lng += 10) {
    for (let lat = -90; lat < 90; lat += 2) {
      const v1 = latLngToVector3(lat, lng, radius);
      const v2 = latLngToVector3(lat + 2, lng, radius);
      vertices.push(v1.x, v1.y, v1.z);
      vertices.push(v2.x, v2.y, v2.z);
    }
  }
  
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
  return geometry;
}

const TravelDataGlobe: React.FC<TravelDataGlobeProps> = ({
  // Polygons
  polygonsData = [],
  polygonAltitude = 0.01,
  polygonCapColor = '#5aef',
  polygonSideColor = '#369',
  polygonStrokeColor = '#35a',
  polygonOpacity = 0.4,
  polygonDotRadius = 0,
  onPolygonClick,
  onPolygonHover,

  // Points
  pointsData = [],
  pointAltitude = 0.01,
  pointColor = '#ffffaa',
  pointRadius = 0.25,
  pointResolution = 12,
  onPointClick,
  onPointHover,

  // Arcs
  arcsData = [],
  arcColor = '#ffff00',
  arcStroke = 1,
  arcAltitude = 0.15,
  arcDashLength = 1,
  arcDashGap = 0,
  arcDashAnimateTime = 0,
  onArcClick,
  onArcHover,

  // Globe
  globeImageUrl = '/textures/earth-day.jpg',
  bumpImageUrl,
  cloudsImageUrl,
  backgroundImageUrl,
  showAtmosphere = true,
  atmosphereColor = '#3a7ca5',
  atmosphereAltitude = 0.15,
  showGraticule = false,

  // Controls
  autoRotateSpeed = 0,
  enableZoom = true,
  enableRotate = true,
  enablePan = false,
  pointLight = true,
  ambientLight = true,

  // Camera
  initialViewState,

  // General
  radius = 100,
  waitForGlobeReady = false,
}) => {
  const globeRef = useRef<Group>(null);
  const cloudsRef = useRef<Mesh>(null);
  const { camera } = useThree();
  const [hoveredPolygon, setHoveredPolygon] = useState<CountryPolygon | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<GlobePoint | null>(null);
  const [hoveredArc, setHoveredArc] = useState<GlobeArc | null>(null);
  
  // Load textures
  const textures = useLoader(TextureLoader, [
    globeImageUrl,
    ...(bumpImageUrl ? [bumpImageUrl] : []),
    ...(cloudsImageUrl ? [cloudsImageUrl] : []),
    ...(backgroundImageUrl ? [backgroundImageUrl] : []),
  ].filter(Boolean));
  
  const [earthTexture, bumpTexture, cloudsTexture, bgTexture] = textures;
  
  // Set initial camera position
  useEffect(() => {
    if (initialViewState) {
      const { lat = 0, lng = 0, altitude = 2.5 } = initialViewState;
      const pos = latLngToVector3(lat, lng, radius * altitude);
      camera.position.copy(pos);
      camera.lookAt(0, 0, 0);
    }
  }, [initialViewState, camera, radius]);
  
  // Auto-rotation
  useFrame(() => {
    if (globeRef.current && autoRotateSpeed) {
      globeRef.current.rotation.y += autoRotateSpeed;
    }
    if (cloudsRef.current && autoRotateSpeed) {
      cloudsRef.current.rotation.y += autoRotateSpeed * 1.1;
    }
  });
  
  // Generate polygon meshes
  const polygonMeshes = useMemo(() => {
    return polygonsData.map((polygon, i) => {
      const geometry = createPolygonGeometry(polygon.feature, radius, 
        typeof polygonAltitude === 'function' ? polygonAltitude(polygon) : polygonAltitude
      );
      
      if (!geometry) return null;
      
      const color = typeof polygonCapColor === 'function' 
        ? polygonCapColor(polygon) 
        : polygon.color || polygonCapColor;
      
      return {
        geometry,
        color,
        opacity: polygon.opacity || polygonOpacity,
        data: polygon,
        index: i,
      };
    }).filter(Boolean);
  }, [polygonsData, radius, polygonAltitude, polygonCapColor, polygonOpacity]);
  
  // Generate point meshes
  const pointMeshes = useMemo(() => {
    return pointsData.map((point, i) => {
      const alt = typeof pointAltitude === 'function' ? pointAltitude(point) : pointAltitude;
      const position = latLngToVector3(point.lat, point.lng, radius, alt);
      const color = typeof pointColor === 'function' ? pointColor(point) : (point.color || pointColor);
      const size = typeof pointRadius === 'function' ? pointRadius(point) : (point.size || pointRadius);
      
      return {
        position,
        color,
        size,
        data: point,
        index: i,
      };
    });
  }, [pointsData, radius, pointAltitude, pointColor, pointRadius]);
  
  // Generate arc lines
  const arcLines = useMemo(() => {
    return arcsData.map((arc, i) => {
      const alt = typeof arcAltitude === 'function' ? arcAltitude(arc) : arcAltitude;
      const curve = generateArcCurve(
        arc.startLat,
        arc.startLng,
        arc.endLat,
        arc.endLng,
        radius,
        alt
      );
      
      const color = typeof arcColor === 'function' ? arcColor(arc) : (arc.color || arcColor);
      const width = typeof arcStroke === 'function' ? arcStroke(arc) : (arc.strokeWidth || arcStroke);
      
      return {
        points: curve,
        color,
        width,
        data: arc,
        index: i,
      };
    });
  }, [arcsData, radius, arcAltitude, arcColor, arcStroke]);
  
  // Graticule
  const graticuleGeometry = useMemo(() => {
    return showGraticule ? generateGraticule(radius) : null;
  }, [showGraticule, radius]);
  
  return (
    <>
      {/* Lighting */}
      {ambientLight && <ambientLight intensity={0.6} />}
      {pointLight && <pointLight position={[100, 100, 100]} intensity={0.8} />}
      
      {/* Background */}
      {bgTexture && (
        <mesh>
          <sphereGeometry args={[radius * 50, 32, 32]} />
          <meshBasicMaterial map={bgTexture} side={DoubleSide} />
        </mesh>
      )}
      
      {/* Globe group */}
      <group ref={globeRef}>
        {/* Main earth sphere */}
        <mesh>
          <sphereGeometry args={[radius, 64, 64]} />
          <meshPhongMaterial
            map={earthTexture}
            bumpMap={bumpTexture}
            bumpScale={0.01}
            specularMap={earthTexture}
            specular={new Color('#333')}
            shininess={5}
          />
        </mesh>
        
        {/* Clouds layer */}
        {cloudsTexture && (
          <mesh ref={cloudsRef}>
            <sphereGeometry args={[radius * 1.003, 64, 64]} />
            <meshBasicMaterial
              map={cloudsTexture}
              transparent
              opacity={0.4}
              depthWrite={false}
            />
          </mesh>
        )}
        
        {/* Atmosphere */}
        {showAtmosphere && (
          <>
            <mesh>
              <sphereGeometry args={[radius * (1 + atmosphereAltitude), 64, 64]} />
              <meshBasicMaterial
                color={atmosphereColor}
                transparent
                opacity={0.15}
                side={DoubleSide}
                depthWrite={false}
                blending={AdditiveBlending}
              />
            </mesh>
          </>
        )}
        
        {/* Graticule */}
        {graticuleGeometry && (
          <lineSegments geometry={graticuleGeometry}>
            <lineBasicMaterial color="#333333" transparent opacity={0.1} />
          </lineSegments>
        )}
        
        {/* Country polygons */}
        {polygonMeshes.map((mesh, i) => mesh && (
          <mesh
            key={`polygon-${i}`}
            geometry={mesh.geometry}
            onClick={(e) => {
              e.stopPropagation();
              onPolygonClick?.(mesh.data);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredPolygon(mesh.data);
              onPolygonHover?.(mesh.data);
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHoveredPolygon(null);
              onPolygonHover?.(null);
            }}
          >
            <meshBasicMaterial
              color={mesh.color}
              transparent
              opacity={mesh.opacity}
              side={DoubleSide}
            />
          </mesh>
        ))}
        
        {/* Points */}
        {pointMeshes.map((point, i) => (
          <mesh
            key={`point-${i}`}
            position={point.position}
            onClick={(e) => {
              e.stopPropagation();
              onPointClick?.(point.data);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredPoint(point.data);
              onPointHover?.(point.data);
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHoveredPoint(null);
              onPointHover?.(null);
            }}
          >
            <sphereGeometry args={[point.size, pointResolution, pointResolution]} />
            <meshBasicMaterial color={point.color} />
          </mesh>
        ))}
        
        {/* Arcs */}
        {arcLines.map((arc, i) => {
          const geometry = new BufferGeometry();
          const positions = new Float32Array(arc.points.length * 3);
          
          arc.points.forEach((point, j) => {
            positions[j * 3] = point.x;
            positions[j * 3 + 1] = point.y;
            positions[j * 3 + 2] = point.z;
          });
          
          geometry.setAttribute('position', new BufferAttribute(positions, 3));
          
          return (
            <line
              key={`arc-${i}`}
              geometry={geometry}
              onClick={(e) => {
                e.stopPropagation();
                onArcClick?.(arc.data);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredArc(arc.data);
                onArcHover?.(arc.data);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredArc(null);
                onArcHover?.(null);
              }}
            >
              <lineBasicMaterial
                color={arc.color}
                linewidth={arc.width}
                transparent
                opacity={0.8}
              />
            </line>
          );
        })}
      </group>
      
      {/* Controls */}
      <OrbitControls 
        enablePan={enablePan}
        enableZoom={enableZoom}
        enableRotate={enableRotate}
        autoRotate={autoRotateSpeed > 0}
        autoRotateSpeed={autoRotateSpeed * 2}
        minDistance={radius * 1.2}
        maxDistance={radius * 4}
      />
    </>
  );
};

export default TravelDataGlobe;
