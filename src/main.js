import { createApp } from 'vue'
import VueCesium from 'vue-cesium'
import 'vue-cesium/lib/theme-default/index.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import VueAxios from 'vue-axios'
import qs from 'qs'

axios.defaults.withCredentials=false;
axios.defaults.baseURL='http://localhost:8080/'

const app = createApp(App)
app.config.globalProperties.$axios=axios;
app.config.globalProperties.$qs=qs;
app.use(ElementPlus)
app.use(VueCesium, {
    cesiumPath: '/Cesium/Cesium.js',
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5MWVhZmFlYS1mYWU2LTQ2ZDQtOTk5ZS03ZGE3MjQyM2FlODYiLCJpZCI6NjE3MjEsImlhdCI6MTYyNjMxMzk3NX0.bdlFAJG5w5iqwdFiFxPfW_h4H5nElCoyqIY0WjUcBvU'
})

app.use(VueAxios,axios).use(router).mount('#app')
app.config.devtools=true
