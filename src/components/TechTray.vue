<template>
  <div ref="container" class="three-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import configData from './config.json';

const container = ref(null);
let scene, camera, renderer, labelRenderer, controls, animationId;
const mainGroup = new THREE.Group();

const availablePlatforms = {
  simple: [],
  medium: [],
  hard: []
};

const challengeMeshes = {};
let playerDrones = [];

const COLORS = {
  simple: 0x00e5ff,
  medium: 0xffcc00,
  hard: 0xff3333,
};

onMounted(() => {
  initScene();
  createCyberWorld();
  syncFromConfig();
  animate();
  window.addEventListener('resize', onWindowResize);
});

const initScene = () => {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, container.value.offsetWidth / container.value.offsetHeight, 1, 10000);
  camera.position.set(0, 375, 550);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(container.value.offsetWidth, container.value.offsetHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.value.appendChild(renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(container.value.offsetWidth, container.value.offsetHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.pointerEvents = 'none';
  container.value.appendChild(labelRenderer.domElement);

  scene.add(new THREE.AmbientLight(0xccddff, 0.4));
  const topLight = new THREE.DirectionalLight(0xffffff, 1.2);
  topLight.position.set(0, 600, 300);
  scene.add(topLight);
  const cyanLight = new THREE.PointLight(0x00e5ff, 2.5, 1500);
  cyanLight.position.set(400, 400, 400);
  scene.add(cyanLight);
  const blueLight = new THREE.PointLight(0x1a56db, 2.5, 1200);
  blueLight.position.set(-500, 300, -200);
  scene.add(blueLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  scene.add(mainGroup);
};

const createCyberWorld = () => {
  mainGroup.clear();
  availablePlatforms.simple = [];
  availablePlatforms.medium = [];
  availablePlatforms.hard = [];

  const trackConfigs = [
    { difficulty: 'simple', radius: 330, corners: 6, sideCount: 3 },
    { difficulty: 'medium', radius: 220, corners: 6, sideCount: 2 },
    { difficulty: 'hard',   radius: 110, corners: 6, sideCount: 1 },
  ];

  const UNIFIED_THICKNESS = 2.5;
  const TRACK_Y_POS = -8;

  const trackBodyMat = new THREE.MeshStandardMaterial({
    color: 0x0f1b2d, metalness: 0.95, roughness: 0.2, flatShading: true
  });
  const trackEdgesMat = new THREE.LineBasicMaterial({
    color: 0x2563eb, transparent: true, opacity: 0.85
  });

  trackConfigs.forEach(config => {
    const { difficulty, radius, corners, sideCount } = config;

    const cornerPoints = [];
    for (let i = 0; i < corners; i++) {
      const angle = (i / corners) * Math.PI * 2;
      cornerPoints.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }

    for (let i = 0; i < corners; i++) {
      const p1 = cornerPoints[i];
      const p2 = cornerPoints[(i + 1) % corners];

      const distance = p1.distanceTo(p2);
      const segmentGeo = new THREE.CylinderGeometry(UNIFIED_THICKNESS, UNIFIED_THICKNESS, distance, 6);
      segmentGeo.scale(1, 1, 2.5);
      segmentGeo.rotateX(Math.PI / 2);

      const segmentMesh = new THREE.Mesh(segmentGeo, trackBodyMat);
      segmentMesh.position.copy(p1).add(p2).multiplyScalar(0.5);
      segmentMesh.position.y = TRACK_Y_POS;

      const targetPoint = p2.clone();
      targetPoint.y = segmentMesh.position.y;
      segmentMesh.lookAt(targetPoint);

      segmentMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(segmentGeo), trackEdgesMat));
      mainGroup.add(segmentMesh);

      addPlatformMesh(p1.x, p1.z);
      availablePlatforms[difficulty].push({ x: p1.x, z: p1.z });

      for (let j = 1; j <= sideCount; j++) {
        const ratio = j / (sideCount + 1);
        const edgeX = THREE.MathUtils.lerp(p1.x, p2.x, ratio);
        const edgeZ = THREE.MathUtils.lerp(p1.z, p2.z, ratio);

        addPlatformMesh(edgeX, edgeZ);
        availablePlatforms[difficulty].push({ x: edgeX, z: edgeZ });
      }
    }
  });

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };
  shuffleArray(availablePlatforms.simple);
  shuffleArray(availablePlatforms.medium);
  shuffleArray(availablePlatforms.hard);

  const centerGeo = new THREE.CylinderGeometry(45, 60, 15, 6);
  centerGeo.rotateY(Math.PI / 6);
  const centerMesh = new THREE.Mesh(centerGeo, new THREE.MeshStandardMaterial({
    color: 0x0a1423, metalness: 0.95, roughness: 0.15, flatShading: true
  }));
  centerMesh.position.y = -2;
  centerMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(centerGeo), new THREE.LineBasicMaterial({ color: 0x2563eb, opacity: 0.8, transparent: true })));
  mainGroup.add(centerMesh);

  const core = new THREE.Mesh(new THREE.SphereGeometry(25, 16, 16), new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x00e5ff, emissiveIntensity: 1.5, wireframe: true }));
  core.name = "core";
  core.position.y = 18;
  mainGroup.add(core);
};

const addPlatformMesh = (x, z) => {
  const platformGeo = new THREE.CylinderGeometry(13, 20, 12, 6);
  const platformMesh = new THREE.Mesh(platformGeo, new THREE.MeshStandardMaterial({
    color: 0x2c2c2c, metalness: 0.85, roughness: 0.25, emissive: 0x042f2e, emissiveIntensity: 0.6, flatShading: true
  }));
  platformMesh.position.set(x, 0, z);
  platformMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(platformGeo), new THREE.LineBasicMaterial({ color: 0x00e5ff, opacity: 0.9, transparent: true })));
  mainGroup.add(platformMesh);
};

const syncFromConfig = () => {
  if (!configData) return;

  const buildingGroup = new THREE.Group();
  buildingGroup.name = "challenges";

  const oldBuildings = mainGroup.getObjectByName("challenges");
  if (oldBuildings) mainGroup.remove(oldBuildings);

  const usedCount = { simple: 0, medium: 0, hard: 0 };

  if (configData.challenges) {
    configData.challenges.forEach((item) => {
      const diff = item.difficulty;
      if (usedCount[diff] >= availablePlatforms[diff].length) return;

      const pos = availablePlatforms[diff][usedCount[diff]];
      usedCount[diff]++;

      const crystalColor = COLORS[diff] || 0x00e5ff;
      const crystal = createEnergyCrystal(crystalColor, item.name);
      crystal.position.set(pos.x, 24, pos.z);
      buildingGroup.add(crystal);

      challengeMeshes[item.name] = {
        localPos: new THREE.Vector3(pos.x, 24, pos.z),
        color: crystalColor
      };
    });
  }

  mainGroup.add(buildingGroup);

  const droneGroup = new THREE.Group();
  droneGroup.name = "drones";

  const oldDrones = mainGroup.getObjectByName("drones");
  if (oldDrones) mainGroup.remove(oldDrones);

  if (configData.players) {
    playerDrones = configData.players.map((player, index) => {
      const mesh = createCyberSpaceship(player.name);

      // 【修正】：统一深绿色激光
      const laserColor = 0x00cc00;
      const laserGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
      laserGeo.rotateX(Math.PI / 2);
      const laserMat = new THREE.MeshBasicMaterial({
        color: laserColor,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const laser = new THREE.Mesh(laserGeo, laserMat);
      laser.scale.set(1, 1, 0.01);
      laser.visible = false;

      droneGroup.add(laser);

      const staticAngle = (index / configData.players.length) * Math.PI * 2;
      mesh.position.set(0, 400, 0);
      droneGroup.add(mesh);

      return { name: player.name, target: player.target, mesh, laser, angle: staticAngle };
    });
  }

  mainGroup.add(droneGroup);
};

function createEnergyCrystal(color, title) {
  const group = new THREE.Group();

  const meshGeo = new THREE.OctahedronGeometry(6);
  const meshMesh = new THREE.Mesh(meshGeo, new THREE.MeshPhongMaterial({
    color, emissive: color, emissiveIntensity: 1.2, wireframe: true, transparent: true, opacity: 0.9, flatShading: true
  }));
  meshMesh.scale.set(1, 2.2, 1);

  const beamGeo = new THREE.CylinderGeometry(0.1, 5, 70, 32, 1, true);
  const beamMesh = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15 }));
  beamMesh.position.y = 1;

  group.add(meshMesh, beamMesh);

  const labelDiv = document.createElement('div');
  labelDiv.textContent = title;
  labelDiv.style.color = '#' + color.toString(16).padStart(6, '0');
  labelDiv.style.fontFamily = 'monospace';
  labelDiv.style.fontSize = '12px';
  labelDiv.style.padding = '2px 6px';
  labelDiv.style.background = 'rgba(0, 20, 30, 0.7)';
  labelDiv.style.border = `1px solid #${color.toString(16)}`;
  labelDiv.style.borderRadius = '3px';
  labelDiv.style.pointerEvents = 'none';

  const label = new CSS2DObject(labelDiv);
  label.position.set(0, 22, 0);
  group.add(label);

  return group;
}

// ==========================================
// 【重构飞船建模】：修正正向坐标系
// 确保 +Z 轴是飞船的正前方向（机头），-Z 是机尾
// ==========================================
const createCyberSpaceship = (playerName) => {
  const shipGroup = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937, metalness: 0.9, roughness: 0.1, flatShading: false
  });
  const edgesMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.8 });

  const bodyGeo = new THREE.SphereGeometry(8, 32, 16);
  bodyGeo.scale(1, 0.7, 2.5);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.add(new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeo, 15), edgesMat));
  shipGroup.add(body);

  const engineMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2, flatShading: false });
  const createEngine = (side) => {
    const engineGroup = new THREE.Group();

    // 引擎主体：旋转让前端指向 +Z
    const mainGeo = new THREE.CylinderGeometry(2.5, 3.5, 20, 32);
    mainGeo.rotateX(Math.PI / 2); // 较小半径端(2.5)朝向 +Z
    const mainMesh = new THREE.Mesh(mainGeo, engineMat);
    mainMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mainGeo, 20), edgesMat));

    // 引擎前端整流罩：放置在 +Z 方向
    const capGeo = new THREE.SphereGeometry(2.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    capGeo.rotateX(Math.PI / 2);
    capGeo.translate(0, 0, 10);
    const capMesh = new THREE.Mesh(capGeo, engineMat);
    capMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(capGeo, 20), edgesMat));

    engineGroup.add(mainMesh, capMesh);
    engineGroup.position.set(10 * side, -1, -2);

    // 尾部火焰：尖端朝向 -Z
    const flameGeo = new THREE.ConeGeometry(2, 20, 32, 1, true);
    flameGeo.rotateX(-Math.PI / 2);
    const flame = new THREE.Mesh(flameGeo, new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    flame.position.z = -16;
    engineGroup.add(flame);

    return engineGroup;
  };

  shipGroup.add(createEngine(1));
  shipGroup.add(createEngine(-1));

  // 玩家名称显示在飞船上方
  const labelDiv = document.createElement('div');
  labelDiv.textContent = `▶ ${playerName}`;
  labelDiv.style.color = '#fff';
  labelDiv.style.fontFamily = 'monospace';
  labelDiv.style.fontSize = '12px';
  labelDiv.style.textShadow = '0 0 4px #00e5ff';
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, 15, 0);
  shipGroup.add(label);

  shipGroup.scale.setScalar(0.7);
  return shipGroup;
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  controls.update();

  mainGroup.rotation.y += 0.001;

  const core = mainGroup.getObjectByName("core");
  if (core) {
    core.rotation.y += 0.02;
    core.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.1);
  }

  playerDrones.forEach(drone => {
    const targetData = challengeMeshes[drone.target];
    if (targetData) {
      const targetLocalPos = targetData.localPos;

      const targetTopPos = targetLocalPos.clone();
      targetTopPos.y += 13; // 晶石顶部尖角

      const hoverRadius = 60;
      const HOVER_HEIGHT = targetLocalPos.y + 120;

      const hoverX = targetLocalPos.x + Math.cos(drone.angle) * hoverRadius;
      const hoverZ = targetLocalPos.z + Math.sin(drone.angle) * hoverRadius;
      const hoverTargetPos = new THREE.Vector3(hoverX, HOVER_HEIGHT, hoverZ);

      // 1. 飞船平移
      drone.mesh.position.lerp(hoverTargetPos, 0.04);

      // 2. 【核心修正】：纯水平 LookAt
      const shipWorldPos = drone.mesh.getWorldPosition(new THREE.Vector3());
      const targetWorldTopPos = targetTopPos.clone().applyMatrix4(mainGroup.matrixWorld);

      // 飞船看向目标的 X和Z坐标，但Y坐标强制等于飞船本身的高度，绝对禁止俯仰
      drone.mesh.lookAt(targetWorldTopPos.x, shipWorldPos.y, targetWorldTopPos.z);
      drone.mesh.rotation.z = 0; // 锁死滚转角

      const distanceToTarget = drone.mesh.position.distanceTo(hoverTargetPos);

      // 3. 到达位置后发射激光
      if (distanceToTarget < 2) {
        if (drone.laser) {
          drone.laser.visible = true;

          const shipPos = drone.mesh.position;

          // 计算水平面上飞船到晶石的方向
          const direction = new THREE.Vector3(
            targetTopPos.x - shipPos.x,
            0,
            targetTopPos.z - shipPos.z
          ).normalize();

          // 沿着机头方向，将激光起点往前推移14个单位 (正好是飞船头部的物理位置)
          const laserStartPos = shipPos.clone().add(direction.multiplyScalar(14));

          const distance = laserStartPos.distanceTo(targetTopPos);
          const midPoint = new THREE.Vector3().addVectors(laserStartPos, targetTopPos).multiplyScalar(0.5);

          drone.laser.position.copy(midPoint);
          // 激光需要 3D 倾斜往下照射，所以使用精准的三维世界坐标
          drone.laser.lookAt(targetWorldTopPos);
          drone.laser.scale.set(1, 1, distance);

          // 激光脉冲特效
          const time = Date.now();
          drone.laser.material.opacity = 0.6 + Math.sin(time * 0.01) * 0.4;
          const thickness = 0.6 + Math.sin(time * 0.05) * 0.4;
          drone.laser.scale.x = thickness;
          drone.laser.scale.y = thickness;
        }
      } else {
        if (drone.laser) {
          drone.laser.visible = false;
        }
      }
    }
  });

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
};

const onWindowResize = () => {
  if (!container.value) return;
  const w = container.value.offsetWidth;
  const h = container.value.offsetHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
};

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onWindowResize);
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.three-container {
  width: 100%;
  height: 100%;
  background: transparent !important;
  pointer-events: auto;
}
</style>