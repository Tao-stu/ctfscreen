<template>
  <div class="arena-wrapper">
    <div class="three-bg">
      <TechTray :data="screenData.trayData" />
    </div>
  </div>
</template>

<script>
import TechTray from '../components/TechTray.vue';
import screenData from '../data/screenData.json';

export default {
  name: 'CenterPanel',
  components: { TechTray },
  data() { return { screenData } }
}
</script>

<style scoped>
.arena-wrapper {
  /* 关键：设为固定定位并撑满全屏 */
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  z-index: 0; /* 确保在最底层，透出背景图 */
}

.three-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  padding: 100px 30px 30px 30px; /* 顶部预留出标题位置 */
  box-sizing: border-box;
  pointer-events: none; /* 允许鼠标穿透点击 3D 场景 */
}

.left-panel, .right-panel {
  pointer-events: auto; /* 恢复面板内部的交互 */
  width: 20%;
}

.label {
  font-size: 14px;
  color: #00ffff;
  letter-spacing: 2px;
  text-shadow: 0 0 10px #00ffff;
}
</style>