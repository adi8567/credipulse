import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeRiskReactor({ riskLevel = 'UNKNOWN', liquidityGap = 0, breachDate = 'No breach' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 300;
    const height = mount.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const isHighRisk = riskLevel === 'HIGH_RISK';
    const mainColor = isHighRisk ? 0xf43f5e : 0x34d399;
    const accentColor = isHighRisk ? 0xfbbf24 : 0x6366f1;

    // Torus Knot Reactor Core
    const knotGeo = new THREE.TorusKnotGeometry(2.4, 0.45, 128, 32, 2, 3);
    const knotMat = new THREE.MeshStandardMaterial({
      color: mainColor,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: true,
      emissive: mainColor,
      emissiveIntensity: isHighRisk ? 0.8 : 0.4,
    });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    scene.add(knot);

    // Inner Plasma Core
    const plasmaGeo = new THREE.DodecahedronGeometry(1.4, 1);
    const plasmaMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const plasma = new THREE.Mesh(plasmaGeo, plasmaMat);
    scene.add(plasma);

    // Dynamic Particle Field
    const pCount = 200;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 12;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 1.6,
      color: mainColor,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const point = new THREE.PointLight(mainColor, 3, 20);
    point.position.set(2, 4, 6);
    scene.add(point);

    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const speed = isHighRisk ? 1.6 : 0.6;

      knot.rotation.x = t * 0.5 * speed;
      knot.rotation.y = t * 0.7 * speed;

      plasma.rotation.y = -t * 1.2 * speed;
      plasma.rotation.z = t * 0.8 * speed;

      const pScale = 1 + Math.sin(t * (isHighRisk ? 6 : 2)) * 0.15;
      plasma.scale.set(pScale, pScale, pScale);

      particles.rotation.y = t * 0.2;

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
      knotGeo.dispose();
      knotMat.dispose();
      plasmaGeo.dispose();
      plasmaMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      renderer.dispose();
    };
  }, [riskLevel]);

  return (
    <div className="relative w-full h-56 flex items-center justify-center overflow-hidden rounded-2xl bg-navy-950/80 border border-rose-500/20 shadow-inner">
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-3 left-4 text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        3D LIQUIDITY STRESS REACTOR
      </div>
      <div className="absolute bottom-3 right-4 text-[10px] font-mono text-slate-400">
        {riskLevel === 'HIGH_RISK' ? `BREACH DEFICIT: -₹${liquidityGap.toLocaleString('en-IN')}` : 'RESERVE: NOMINAL'}
      </div>
    </div>
  );
}
