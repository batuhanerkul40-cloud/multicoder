"""
Bundles the generated OBJ and MTL into a self-contained, offline-capable, interactive Three.js 3D Viewer.
"""

import os
import json

DIR = r"C:\Users\batuhan\Desktop\IDE\models\treasure_chest"
OBJ_PATH = os.path.join(DIR, "treasure_chest.obj")
MTL_PATH = os.path.join(DIR, "treasure_chest.mtl")
HTML_PATH = os.path.join(DIR, "viewer.html")

obj_text = open(OBJ_PATH, "r", encoding="utf-8").read()
mtl_text = open(MTL_PATH, "r", encoding="utf-8").read()

html_content = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Efsanevi Hazine Sandığı - 3D Oyun Modeli</title>
  <style>
    * {{
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      user-select: none;
    }}
    body {{
      background: radial-gradient(circle at 50% 40%, #171b26 0%, #0a0c12 100%);
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
    }}
    #canvas-container {{
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      cursor: grab;
    }}
    #canvas-container:active {{
      cursor: grabbing;
    }}
    /* Top Header */
    .header-bar {{
      position: absolute;
      top: 24px;
      left: 24px;
      pointer-events: none;
      z-index: 10;
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fbbf24;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }}
    .title {{
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff;
      text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }}
    .subtitle {{
      font-size: 13px;
      color: #94a3b8;
      margin-top: 4px;
    }}
    /* Stats Panel */
    .stats-card {{
      position: absolute;
      top: 24px;
      right: 24px;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 16px 20px;
      min-width: 200px;
      z-index: 10;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }}
    .stats-title {{
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 12px;
    }}
    .stat-row {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 13px;
    }}
    .stat-label {{
      color: #94a3b8;
    }}
    .stat-value {{
      font-weight: 600;
      color: #f1f5f9;
      font-variant-numeric: tabular-nums;
    }}
    .stat-value.gold {{
      color: #fbbf24;
    }}
    .stat-value.cyan {{
      color: #38bdf8;
    }}
    /* Bottom Controls */
    .controls-bar {{
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(16px);
      padding: 8px 12px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
      z-index: 10;
    }}
    .btn {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #f8fafc;
      padding: 8px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }}
    .btn:hover {{
      background: rgba(255, 255, 255, 0.14);
      border-color: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
    }}
    .btn.active {{
      background: #3b82f6;
      border-color: #60a5fa;
      color: #ffffff;
      box-shadow: 0 0 16px rgba(59, 130, 246, 0.5);
    }}
    .btn.accent {{
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border-color: #fbbf24;
      color: #ffffff;
      box-shadow: 0 0 16px rgba(245, 158, 11, 0.4);
    }}
    .hint {{
      position: absolute;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      color: #64748b;
      pointer-events: none;
      letter-spacing: 0.02em;
    }}
  </style>
</head>
<body>

  <div id="canvas-container"></div>

  <!-- Header -->
  <div class="header-bar">
    <div class="badge">🎮 Low-Poly Oyun Modeli</div>
    <h1 class="title">Efsanevi Hazine Sandığı</h1>
    <p class="subtitle">Oyun motorları için optimize edilmiş 3D varlık (OBJ + PBR Materyaller)</p>
  </div>

  <!-- Stats Card -->
  <div class="stats-card">
    <div class="stats-title">Model Detayları</div>
    <div class="stat-row">
      <span class="stat-label">Format:</span>
      <span class="stat-value">.OBJ / .MTL</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Köşeler (Vertices):</span>
      <span class="stat-value">312</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Üçgenler (Triangles):</span>
      <span class="stat-value gold">318</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Materyaller:</span>
      <span class="stat-value cyan">8 Parça</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Topoloji:</span>
      <span class="stat-value">Game-Ready</span>
    </div>
  </div>

  <!-- Helper text -->
  <div class="hint">🖱️ Döndürmek için sol tıkla sürükle • Yakınlaşmak için tekerleği kaydır</div>

  <!-- Floating Controls -->
  <div class="controls-bar">
    <button id="btn-rotate" class="btn active">🔄 Otomatik Döndür</button>
    <button id="btn-wireframe" class="btn">🕸️ Tel Kafes (Wireframe)</button>
    <button id="btn-reset" class="btn">🎯 Kamerayı Sıfırla</button>
    <button id="btn-lid" class="btn accent">✨ Büyülü Işıltı</button>
  </div>

  <!-- Embedded Model Data (No CORS / file protocol issues!) -->
  <script>
    window.EMBEDDED_OBJ = {json.dumps(obj_text)};
    window.EMBEDDED_MTL = {json.dumps(mtl_text)};
  </script>

  <!-- Three.js + Loaders via CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/MTLLoader.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js"></script>

  <script>
    // Scene Setup
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0c12, 0.08);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(2.8, 2.2, 3.2);

    const renderer = new THREE.WebGLRenderer({{ antialias: true, alpha: true }});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.6, 0);
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // don't go below floor
    controls.minDistance = 1.5;
    controls.maxDistance = 8.0;

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0x4a5568, 0.8);
    scene.add(ambientLight);

    // Warm Sun Light
    const dirLight = new THREE.DirectionalLight(0xffecd2, 1.8);
    dirLight.position.set(4, 6, 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 15;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    // Cool Blue Rim Light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    // Subtle front fill
    const fillLight = new THREE.PointLight(0xfef08a, 0.9, 8);
    fillLight.position.set(0, 1.2, 2.5);
    scene.add(fillLight);

    // Pedestal Floor with soft reflection
    const floorGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.15, 48);
    const floorMat = new THREE.MeshStandardMaterial({{
      color: 0x111622,
      roughness: 0.4,
      metalness: 0.6,
    }});
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.075;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid helper on floor
    const grid = new THREE.GridHelper(5, 10, 0x3b82f6, 0x1e293b);
    grid.position.y = 0.001;
    scene.add(grid);

    // Magical Crystal Light (pulsing)
    const crystalLight = new THREE.PointLight(0x38bdf8, 2.0, 3.5);
    crystalLight.position.set(0, 1.0, 0);
    scene.add(crystalLight);

    let chestModel = null;
    let autoRotate = true;
    let wireframeMode = false;
    let magicPulse = true;
    const materialsList = [];

    // Parse MTL & OBJ
    const mtlLoader = new THREE.MTLLoader();
    const materials = mtlLoader.parse(window.EMBEDDED_MTL);
    materials.preload();

    const objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    const obj = objLoader.parse(window.EMBEDDED_OBJ);

    obj.traverse((child) => {{
      if (child.isMesh) {{
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {{
          materialsList.push(child.material);
          // Emissive tweaks for jewels
          if (child.material.name === "Mat_Crystal_Cyan") {{
            child.material.emissive = new THREE.Color(0x00d8f6);
            child.material.emissiveIntensity = 0.8;
            child.material.roughness = 0.1;
            child.material.metalness = 0.1;
          }} else if (child.material.name === "Mat_Ruby") {{
            child.material.emissive = new THREE.Color(0xf43f5e);
            child.material.emissiveIntensity = 0.9;
          }} else if (child.material.name.includes("Gold")) {{
            child.material.metalness = 0.85;
            child.material.roughness = 0.25;
          }} else if (child.material.name.includes("Iron")) {{
            child.material.metalness = 0.7;
            child.material.roughness = 0.4;
          }} else if (child.material.name.includes("Wood")) {{
            child.material.roughness = 0.8;
          }}
        }}
      }}
    }});

    chestModel = obj;
    scene.add(chestModel);

    // Add floating magical dust particles
    const particleCount = 40;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {{
      particlePos[i] = (Math.random() - 0.5) * 1.6;
      particlePos[i + 1] = 0.6 + Math.random() * 1.4;
      particlePos[i + 2] = (Math.random() - 0.5) * 1.6;
    }}
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({{
      color: 0x38bdf8,
      size: 0.04,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    }});
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Animation Loop
    let clock = new THREE.Clock();
    function animate() {{
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Auto rotation
      if (autoRotate && chestModel) {{
        chestModel.rotation.y += 0.006;
      }}

      // Magical crystal pulsing
      if (magicPulse) {{
        const pulse = Math.sin(elapsedTime * 3) * 0.5 + 1.2;
        crystalLight.intensity = pulse * 1.5;
        materialsList.forEach(m => {{
          if (m.name === "Mat_Crystal_Cyan") {{
            m.emissiveIntensity = pulse * 0.7;
          }}
        }});
      }}

      // Particle floating
      const positions = particles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {{
        positions[i] += Math.sin(elapsedTime + i) * 0.002;
      }}
      particles.geometry.attributes.position.needsUpdate = true;

      controls.update();
      renderer.render(scene, camera);
    }}
    animate();

    // UI Buttons
    document.getElementById('btn-rotate').addEventListener('click', function() {{
      autoRotate = !autoRotate;
      this.classList.toggle('active', autoRotate);
    }});

    document.getElementById('btn-wireframe').addEventListener('click', function() {{
      wireframeMode = !wireframeMode;
      this.classList.toggle('active', wireframeMode);
      materialsList.forEach(m => m.wireframe = wireframeMode);
    }});

    document.getElementById('btn-reset').addEventListener('click', function() {{
      camera.position.set(2.8, 2.2, 3.2);
      controls.target.set(0, 0.6, 0);
      if (chestModel) chestModel.rotation.set(0, 0, 0);
    }});

    document.getElementById('btn-lid').addEventListener('click', function() {{
      magicPulse = !magicPulse;
      this.classList.toggle('active', magicPulse);
      crystalLight.intensity = magicPulse ? 2.0 : 0.0;
      particles.visible = magicPulse;
    }});

    // Window resize
    window.addEventListener('resize', () => {{
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }});
  </script>
</body>
</html>
"""

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Viewer oluşturuldu: {HTML_PATH} ({len(html_content)} byte)")
