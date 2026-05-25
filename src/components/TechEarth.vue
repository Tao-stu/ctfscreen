<template>
  <div ref="globeContainer" class="globe-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, defineProps } from 'vue';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import earthTexture from '@/assets/earth.png';

const props = defineProps({
  mapConfig: {
    type: Object,
    default: () => ({ arcs: [], rings: [] })
  }
});

const globeContainer = ref(null);
let scene, camera, renderer, controls, globe;
let animationFrameId;
let resizeObserver;

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      initScene();
      initGlobe();
      animate();
    }, 500);
  });
});

const initScene = () => {
  const container = globeContainer.value;
  if (!container) return;

  const width = container.offsetWidth;
  const height = container.offsetHeight;

  scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 2.0));

  camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
  // 保持之前的放大效果
  camera.position.set(0, 100, 260);

  // 2. 确保 alpha: true 开启，并显式设置 setClearColor 为 0，彻底透明
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.enablePan = false;
  controls.minDistance = 150;
  controls.maxDistance = 400;

  resizeObserver = new ResizeObserver(() => {
    if (container.offsetWidth > 0 && container.offsetHeight > 0) {
      camera.aspect = container.offsetWidth / container.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.offsetWidth, container.offsetHeight);
    }
  });
  resizeObserver.observe(container);
};

const initGlobe = () => {
  globe = new ThreeGlobe()
      .globeImageUrl(earthTexture);

  const globeMaterial = globe.globeMaterial();
  globeMaterial.color = new THREE.Color('#ffffff');
  globeMaterial.emissive = new THREE.Color('#112244');
  globeMaterial.emissiveIntensity = 0.3;
  globeMaterial.shininess = 0.9;

  scene.add(globe);

  // 3. 适度调低大气层高度 (从 0.25 降到 0.15)，防止边缘光晕过大产生视觉切割感
  globe.showAtmosphere(true)
      .atmosphereColor('#1A52B8')
      .atmosphereAltitude(0.15);

  globe.arcsData(props.mapConfig.arcs)
      .arcColor('color')
      .arcDashLength(0.4)
      .arcDashGap(2)
      .arcDashAnimateTime(2000)
      .arcAltitudeAutoScale(0.6)
      .arcStroke(0.6);

  globe.ringsData(props.mapConfig.rings)
      .ringColor(d => d.color)
      .ringMaxRadius(8)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(1200);
};

const animate = () => {
  if (controls) controls.update();
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
  animationFrameId = requestAnimationFrame(animate);
};

onBeforeUnmount(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (resizeObserver && globeContainer.value) resizeObserver.unobserve(globeContainer.value);
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
  }
});
</script>

<style scoped>
.globe-container {
  width: 100%;
  height: 100%;
  /* 4. 彻底删除了之前的 radial-gradient 背景色，确保无任何边框线 */
  background: transparent;
}
</style>