"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface ComplexPoint {
  re: number;
  im: number;
  id?: string;
}

interface ZPlane3DProps {
  poles: ComplexPoint[];
  zeros: ComplexPoint[];
}

export default function ZPlane3D({ poles, zeros }: ZPlane3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Initialize scene if not already created
    if (!sceneRef.current) {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a1929);
      sceneRef.current = scene;
      
      // Camera setup
      const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
      camera.position.set(2, 2, 2);
      cameraRef.current = camera;
      
      // Renderer setup with responsive settings
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: 'high-performance' // Better performance on high-DPI displays
      });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      
      // Controls setup with better defaults for touch interactions
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.1; // More responsive controls
      controls.rotateSpeed = 0.8;
      controls.zoomSpeed = 1.2;
      controls.panSpeed = 0.8;
      controls.minDistance = 1; // Prevent zooming too close
      controls.maxDistance = 10; // Prevent zooming too far
      controls.enableRotate = true; // Better for touch devices
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
      controlsRef.current = controls;
      
      // Add axes with consistent relative sizing
      const axesHelper = new THREE.AxesHelper(2);
      scene.add(axesHelper);
      
      // Add unit circle with adaptive thickness
      const unitCircleGeometry = new THREE.TorusGeometry(1, 0.02, 16, 100);
      const unitCircleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const unitCircle = new THREE.Mesh(unitCircleGeometry, unitCircleMaterial);
      unitCircle.rotation.x = Math.PI / 2;
      scene.add(unitCircle);
      
      // Grid with consistent size
      const gridHelper = new THREE.GridHelper(2, 20, 0x444444, 0x222222);
      scene.add(gridHelper);
      
      // Lights for better visibility
      const ambientLight = new THREE.AmbientLight(0x404040);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(1, 2, 3);
      scene.add(directionalLight);
      
      // Animation loop with performance optimization
      let frameId: number;
      const animate = () => {
        frameId = requestAnimationFrame(animate);
        
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        
        if (rendererRef.current && cameraRef.current && sceneRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      
      animate();
      
      // Responsive resize handler with throttling
      let resizeTimeout: NodeJS.Timeout;
      const handleResize = () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        
        resizeTimeout = setTimeout(() => {
          if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
          
          const width = mountRef.current.clientWidth;
          const height = mountRef.current.clientHeight;
          
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
          rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }, 100); // Throttle resize events
      };
      
      window.addEventListener('resize', handleResize);
      
      // Handle orientation change for mobile devices
      window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 200); // Delay to ensure correct dimensions after orientation change
      });
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
        cancelAnimationFrame(frameId);
        if (mountRef.current && rendererRef.current) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current?.dispose();
      };
    }
    
    // Update poles and zeros with better sizing based on screen dimensions
    if (sceneRef.current) {
      // Remove existing poles and zeros
      sceneRef.current.children = sceneRef.current.children.filter(
        child => !child.userData.isPole && !child.userData.isZero
      );
      
      // Calculate responsive marker size - larger on small screens for touch
      const markerSize = window.innerWidth < 768 ? 0.18 : 0.15;
      
      // Add poles (red X markers) with responsive size
      poles.forEach(pole => {
        const poleGroup = new THREE.Group();
        poleGroup.userData = { isPole: true };
        
        const material = new THREE.LineBasicMaterial({ 
          color: 0xff3333, 
          linewidth: 3,
          fog: true // Better depth perception
        });
        
        // Create X shape with responsive size
        const size = markerSize;
        
        // Line 1 (top-left to bottom-right)
        const line1Geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-size, 0, -size),
          new THREE.Vector3(size, 0, size)
        ]);
        const line1 = new THREE.Line(line1Geo, material);
        
        // Line 2 (top-right to bottom-left)
        const line2Geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(size, 0, -size),
          new THREE.Vector3(-size, 0, size)
        ]);
        const line2 = new THREE.Line(line2Geo, material);
        
        poleGroup.add(line1, line2);
        poleGroup.position.set(pole.re, 0, pole.im);
        if (sceneRef.current) {
          sceneRef.current.add(poleGroup);
        }
      });
      
      // Add zeros (blue O markers) with responsive size
      zeros.forEach(zero => {
        // Scale ring size based on screen
        const outerRadius = window.innerWidth < 768 ? 0.14 : 0.13;
        const innerRadius = window.innerWidth < 768 ? 0.10 : 0.10;
        
        const zeroGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
        const zeroMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x00aaff,
          side: THREE.DoubleSide // Visible from both sides
        });
        const zeroMesh = new THREE.Mesh(zeroGeometry, zeroMaterial);
        zeroMesh.rotation.x = -Math.PI / 2;
        zeroMesh.position.set(zero.re, 0, zero.im);
        zeroMesh.userData = { isZero: true };
        if (sceneRef.current) {
          sceneRef.current.add(zeroMesh);
        }
      });
    }
  }, [poles, zeros]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: "min(400px, 50vh)" }}>
      <div 
        ref={mountRef} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ touchAction: "none" }} // Improve touch handling
      ></div>
      <div className="absolute top-2 right-2 bg-slate-800/90 p-3 rounded-lg text-sm text-cyan-300 border border-cyan-900/30 shadow-lg">
        <div className="mb-3 font-bold font-mono">Z-PLANE NAVIGATOR</div>
        <div className="mb-1"><span className="inline-block w-3 h-3 bg-red-500 mr-2"></span> Poles: {poles.length}</div>
        <div className="mb-1"><span className="inline-block w-3 h-3 border-2 border-blue-500 rounded-full mr-2"></span> Zeros: {zeros.length}</div>
        <div className="mt-3 text-xs text-gray-300">
          <div>• Drag to rotate</div>
          <div>• Scroll/pinch to zoom</div>
          <div>• Right-click/two-finger drag to pan</div>
        </div>
      </div>
    </div>
  );
} 