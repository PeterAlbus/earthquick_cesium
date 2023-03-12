<template>
  <el-button type="success" round @click="switchLanguage" style="margin: 5px">{{ $t('SwitchLanguage.another')}}</el-button>
</template>

<script>
import libLocale from "@/i18n/lib";
export default {
  name: "SwitchLanguage",
  methods: {
    switchLanguage() {
      this.$i18n.locale = this.$i18n.locale === 'en' ? 'zh' : 'en'
      libLocale.current = this.$i18n.locale
      localStorage.setItem('language', this.$i18n.locale)
      window.location.reload()
    }
  }
}
</script>

<style scoped>

</style>
