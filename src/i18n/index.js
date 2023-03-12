import { createI18n } from 'vue-i18n'
import zh from './zh'
import en from './en'

let language = localStorage.getItem('language')||'en'

const i18n = createI18n({
    legacy: false,  // 没有该参数可能会报错
    locale: language,
    messages: {
        zh,
        en
    }
})

export default i18n
