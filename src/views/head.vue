<template>
  <div class="header-center">
    <h1 class="title">{{ title }}</h1>
  </div>
</template>

<script>
import configData from '../components/config.json'

export default {
  name: 'ModuleTitle',
  data() {
    return {
      title: configData.title || '网络安全大赛实时大屏'
    }
  }
}
</script>

<style scoped>
.header-center {
  width: 100%;
  height: 80px;
  margin-bottom: 10px;
}
.title {
  text-align: center;
  height: 80px;
  line-height: 80px;
  color: #cdddf7;
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 2px;
  margin: 0;
  background-image: url(../assets/head.png);
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
}
</style>