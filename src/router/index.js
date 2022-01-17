import { createRouter, createWebHashHistory } from 'vue-router'
const Cesium=()=>import('../views/Cesium')

const routes = [
  {
    path: '/',
    name: 'Cesium',
    component: Cesium
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
