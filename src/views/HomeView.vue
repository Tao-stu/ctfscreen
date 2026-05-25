<template>
  <div class="content bg">
    <dv-full-screen-container>
    <!-- header -->
    <Moduletitle />

    <!-- main -->
     <ModuleMain />

    </dv-full-screen-container>
  </div>
</template>

<script>
import Moduletitle from './head.vue'
import ModuleMain from './CenterPanel.vue'

export default {
  name: 'HomeView',
  components: {
    Moduletitle,
    ModuleMain
  },
}
</script>
