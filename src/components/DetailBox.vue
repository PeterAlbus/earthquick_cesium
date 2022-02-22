<template>
  <transition name="detail-box">
    <div class="detail-box" v-if="showBox">
      <div style="display: flex;justify-content: space-between;align-items: center;padding: 3px">
        <h2 style="color: black;margin: 0">{{title}}</h2>
        <div>
          <el-button type="primary" @click="$emit('onClickButton')" size="mini" v-if="showButton">选择</el-button>
          <i class="el-icon-close" @click="$emit('onClose')" style="color: black;cursor: pointer"></i>
        </div>
      </div>
      <el-table :data="info" :stripe="true" :show-header="false" >
        <el-table-column prop="key" label="key"/>
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
  padding: 6px;
  position: absolute;
  bottom: 10%;
  right: 30px;
  color: #fff!important;
  background: rgba(255,255,255,90%);
  width: 450px;
  z-index: 999;

  border-radius: 5px;
  box-shadow: 3px 3px 3px 3px #333333;
}

.detail-box-enter,
.detail-box-leave-to {
  transform : translateX(100%);
}
.detail-box-enter-active,
.detail-box-leave-active { transition: all .6s;}
</style>
