import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CashFlowHologram({ healthScore = 75, balance = 28500, riskLevel = 'HEALTHY' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 320;
    const height = mount.clientHeight || 260;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 14;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const isHighRisk = riskLevel === 'HIGH_RISK';
    const primaryColor = isHighRisk ? 0xf43f5e : 0x6366f1;
    const secondaryColor = isHighRisk ? 0xfbbf24 : 0x34d399;

    // Outer Gyro Ring 1
    const ring1Geo = new THREE.TorusGeometry(5.2, 0.08, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    scene.add(ring1);

    // Outer Gyro Ring 2
    const ring2Geo = new THREE.TorusGeometry(4.4, 0.06, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: secondaryColor,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    scene.add(ring2);

    // Inner Icosahedron Wireframe Core
    const coreGeo = new THREE.IcosahedronGeometry(2.6, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Inner Glowing Particle Sphere
    const innerGeo = new THREE.SphereGeometry(1.6, 24, 24);
    const innerMat = new THREE.MeshBasicMaterial({
      color: secondaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerSphere);

    // Floating Telemetry Satellites
    const satCount = 18;
    const satGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const satMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      blending: THREE.AdditiveBlending,
    });
    const satellites = new THREE.Group();

    for (let i = 0; i < satCount; i++) {
      const sat = new THREE.Mesh(satGeo, satMat);
      const theta = (i / satCount) * Math.PI * 2;
      const radius = 3.6 + (i % 3) * 0.8;
      sat.position.set(Math.cos(theta) * radius, (Math.random() - 0.5) * 2, Math.sin(theta) * radius);
      satellites.add(sat);
    }
    scene.add(satellites);

    // Lighting
    const pointLight = new THREE.PointLight(primaryColor, 3, 20);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      ring1.rotation.x = t * 0.4;
      ring1.rotation.y = t * 0.3;

      ring2.rotation.y = -t * 0.5;
      ring2.rotation.z = t * 0.25;

      core.rotation.x = -t * 0.2;
      core.rotation.y = t * 0.4;

      const scalePulse = 1 + Math.sin(t * 3) * 0.08;
      innerSphere.scale.set(scalePulse, scalePulse, scalePulse);
      innerSphere.rotation.y = t * 0.8;

      satellites.rotation.y = t * 0.35;
      satellites.rotation.x = Math.sin(t * 0.5) * 0.2;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      satGeo.dispose();
      satMat.dispose();
      renderer.dispose();
    };
  }, [riskLevel]);

  return (
    <div className="relative w-full h-64 flex items-center justify-center overflow-hidden rounded-2xl bg-navy-950/60 border border-indigo-500/20 shadow-inner">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Cyberpunk HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between text-xs">
        <div className="flex justify-between items-center text-[10px] text-indigo-400 font-mono tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-mint-400 animate-ping" />
            3D TELEMETRY ORB
          </span>
          <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 uppercase font-bold">
            {riskLevel}
          </span>
        </div>

        {/* Center Hologram Metric */}
        <div className="text-center z-10">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
            Liquidity Velocity Pulse
          </div>
          <div className="text-2xl font-black text-white tracking-tight drop-shadow-md">
            ₹{balance.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] font-semibold text-mint-400 mt-0.5">
            Health Index: {healthScore}/100
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
          <span>ORB::ROTATION_ACTIVE</span>
          <span>RAZORPAY_STREAM_OK</span>
        </div>
      </div>
    </div>
  );
}
