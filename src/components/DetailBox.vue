<template>
  <transition name="slide-fade">
    <div class="detail-box" v-if="showBox">
      <div style="display: flex;justify-content: space-between;align-items: center;padding: 3px">
        <h2 style="color: black;margin: 0">{{title}}</h2>
        <div>
          <el-button type="primary" @click="$emit('onClickButton')" size="mini" v-if="showButton">选择</el-button>
          <i class="el-icon-close" @click="$emit('onClose')" style="color: black;cursor: pointer"></i>
        </div>
      </div>
      <el-table :data="info" :stripe="true" :show-header="false" border>
        <el-table-column prop="key" label="key" width="100"/>
        <el-table-column prop="value" label="value"/>
      </el-table>
    </div>
  </transition>
</template>

<script>
export default {
  props: ['info','title','showBox','showButton'],
  emits: ['onClickButton','onClose'],
  name: "DetailBox"
}
</script>

<style scoped>
.detail-box{
  padding: 9px 13px 14px 13px;
  position: absolute;
  bottom: 10%;
  right: 30px;
  color: #fff!important;
  background: rgba(255,255,255,100%);
  width: 450px;
  z-index: 999;

  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
}

.detail-box-enter,
.detail-box-leave-to {
  transform : translateX(100%);
}
.detail-box-enter-active,
.detail-box-leave-active { transition: all .6s;}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
