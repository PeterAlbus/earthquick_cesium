import { createApp } from 'vue'
import i18n from "@/i18n";
import VueCesium from 'vue-cesium'
import 'vue-cesium/dist/index.css'
import enUS from 'vue-cesium/es/locale/lang/en-us'
import zhHans from "vue-cesium/es/locale/lang/zh-hans";
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import VueAxios from 'vue-axios'
import qs from 'qs'

axios.defaults.withCredentials=false;
axios.defaults.baseURL='https://www.peteralbus.com:8087/'
// axios.defaults.baseURL='https://localhost:8087/'
const app = createApp(App)
app.config.globalProperties.$axios=axios;
app.config.globalProperties.$qs=qs;
app.use(ElementPlus)
app.use(i18n)
app.use(VueCesium, {
    cesiumPath: 'https://file.peteralbus.com/assets/cesium/Cesium191/Cesium.js',
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5MWVhZmFlYS1mYWU2LTQ2ZDQtOTk5ZS03ZGE3MjQyM2FlODYiLCJpZCI6NjE3MjEsImlhdCI6MTYyNjMxMzk3NX0.bdlFAJG5w5iqwdFiFxPfW_h4H5nElCoyqIY0WjUcBvU',
    locale: {zh:zhHans, en: enUS}[localStorage.getItem('language')||'en'],
})
app.use(VueAxios,axios).use(router).mount('#app')
app.config.devtools=true
