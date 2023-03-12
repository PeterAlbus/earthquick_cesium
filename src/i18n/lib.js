import cesiumEnUS from 'vue-cesium/es/locale/lang/en-us'
import cesiumZhCN from 'vue-cesium/es/locale/lang/zh-hans'
import eleZhCN from 'element-plus/es/locale/lang/zh-cn'
import eleEnUS from 'element-plus/es/locale/lang/en'

let libLocale = {
    current: localStorage.getItem('language')||'en',
    element: {
        zh: eleZhCN,
        en: eleEnUS,
    },
    cesium: {
        zh: cesiumEnUS,
        en: cesiumZhCN,
    }
}

export default libLocale
