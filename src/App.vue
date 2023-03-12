<template>
  <el-config-provider :locale="libLocale.element[libLocale.current]">
    <router-view/>
  </el-config-provider>
</template>

<script setup>
import libLocale from "@/i18n/lib";
</script>

<style>

</style>
