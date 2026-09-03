import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeSimulatorSphere({ advanceAmount = 20000, isResolved = true }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 320;
    const height = mount.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 11;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const mainColor = isResolved ? 0x34d399 : 0xf43f5e;
    const glowColor = isResolved ? 0x6366f1 : 0xfbbf24;

    // Main Polyhedron Core
    const sphereGeo = new THREE.IcosahedronGeometry(2.8, isResolved ? 2 : 0);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: mainColor,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: true,
      emissive: mainColor,
      emissiveIntensity: isResolved ? 0.9 : 0.4,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Orbital Energy Rings
    const ringGeo = new THREE.TorusGeometry(4.2, 0.05, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const ringA = new THREE.Mesh(ringGeo, ringMat);
    const ringB = new THREE.Mesh(ringGeo, ringMat);
    ringA.rotation.x = Math.PI / 4;
    ringB.rotation.y = Math.PI / 3;
    scene.add(ringA);
    scene.add(ringB);

    // Energy Particles
    const pCount = 120;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const u = (i / pCount) * Math.PI * 2;
      pPos[i * 3] = Math.cos(u) * 4.2 + (Math.random() - 0.5) * 0.4;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      pPos[i * 3 + 2] = Math.sin(u) * 4.2 + (Math.random() - 0.5) * 0.4;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 1.8,
      color: mainColor,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Lights
    const point = new THREE.PointLight(mainColor, 3, 20);
    point.position.set(0, 0, 8);
    scene.add(point);

    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      sphere.rotation.x = t * 0.4;
      sphere.rotation.y = t * 0.6;

      ringA.rotation.x += 0.01;
      ringA.rotation.y += 0.015;

      ringB.rotation.y -= 0.012;
      ringB.rotation.z += 0.008;

      particles.rotation.y = t * 0.8;

      const scalePulse = 1 + Math.sin(t * 4) * (isResolved ? 0.06 : 0.02);
      sphere.scale.set(scalePulse, scalePulse, scalePulse);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      sphereGeo.dispose();
      sphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      renderer.dispose();
    };
  }, [advanceAmount, isResolved]);

  return (
    <div className="relative w-full h-64 flex items-center justify-center overflow-hidden rounded-2xl bg-navy-950/70 border border-mint-500/20 shadow-inner">
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-3 left-4 text-[10px] font-mono text-mint-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-mint-400 animate-ping" />
        3D WORKING CAPITAL DYNAMICS
      </div>
      <div className="absolute bottom-3 right-4 text-[11px] font-mono font-bold text-mint-300">
        +{`₹${advanceAmount.toLocaleString('en-IN')}`} INJECTION
      </div>
    </div>
  );
}
