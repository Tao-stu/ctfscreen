const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true
})
const path = require('path');

module.exports = {
  // 让 Babel 帮忙转译 three-globe，避免 ES6 语法在旧浏览器报错
  transpileDependencies: ['three-globe'],

  configureWebpack: {
    resolve: {
      alias: {
        // 强制告诉 Webpack 去哪里找最新版 three 隐藏的这几个新模块
        'three/webgpu': path.resolve(__dirname, 'node_modules/three/build/three.webgpu.js'),
        'three/tsl': path.resolve(__dirname, 'node_modules/three/build/three.tsl.js'),
        'three/addons': path.resolve(__dirname, 'node_modules/three/examples/jsm')
      }
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          resolve: {
            // 解决 Webpack 5 对现代 ESM 模块严格导入后缀的报错
            fullySpecified: false
          }
        }
      ]
    }
  }
}