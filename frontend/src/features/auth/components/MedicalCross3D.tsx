import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const MedicalCross3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth || 240;
    const height = currentMount.clientHeight || 240;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // 2. Build 3D Extruded Medical Cross Geometry (+)
    const shape = new THREE.Shape();
    const arm = 0.5;
    const len = 1.4;

    // Mathematical outline of a symmetrical hospital cross
    shape.moveTo(-arm, len);
    shape.lineTo(arm, len);
    shape.lineTo(arm, arm);
    shape.lineTo(len, arm);
    shape.lineTo(len, -arm);
    shape.lineTo(arm, -arm);
    shape.lineTo(arm, -len);
    shape.lineTo(-arm, -len);
    shape.lineTo(-arm, -arm);
    shape.lineTo(-len, -arm);
    shape.lineTo(-len, arm);
    shape.lineTo(-arm, arm);
    shape.closePath();

    const extrudeSettings = {
      steps: 2,
      depth: 0.45,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.12,
      bevelSegments: 6
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    // 3. Luxurious Medical Blue Metallic Shader
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#38BDF8'),       // Vibrant cyan-blue highlights
      emissive: new THREE.Color('#0369A1'),    // Inner medical blue glow
      roughness: 0.15,
      metalness: 0.4,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1
    });

    const crossMesh = new THREE.Mesh(geometry, material);
    scene.add(crossMesh);

    // 4. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x38bdf8, 3, 10);
    rimLight.position.set(-4, -3, 3);
    scene.add(rimLight);

    // 5. Interactive Mouse Tracking
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = currentMount.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / width - 0.5) * 2;
      mouseY = -((e.clientY - rect.top) / height - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 6. 60 FPS Render Loop (Continuous Floating & Spinning)
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Smooth continuous Y-axis rotation
      crossMesh.rotation.y = elapsed * 0.8;
      
      // Floating vertical bobbing
      crossMesh.position.y = Math.sin(elapsed * 1.5) * 0.15;

      // Subtle responsive tilt toward cursor
      crossMesh.rotation.x = THREE.MathUtils.lerp(crossMesh.rotation.x, mouseY * 0.5, 0.05);
      crossMesh.rotation.z = THREE.MathUtils.lerp(crossMesh.rotation.z, -mouseX * 0.5, 0.05);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="w-48 h-48 sm:w-56 sm:h-56 mx-auto flex items-center justify-center select-none pointer-events-auto"
      title="Interactive 3D Medical Cross"
    />
  );
};