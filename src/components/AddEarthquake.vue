<template>
  <el-button type="success" round @click="addEarthquakeVisible=true" style="margin: 5px" icon="el-icon-plus">添加地震</el-button>
  <el-dialog
      v-model="addEarthquakeVisible"
      title="添加地震"
      width="50%"
  >
    <el-form ref="form" :model="form" label-width="120px">
      <el-form-item label="地震名称">
        <el-input v-model="form.earthquakeName"></el-input>
      </el-form-item>
      <el-form-item label="震级">
        <el-input v-model="form.magnitude"></el-input>
      </el-form-item>
      <el-form-item label="震源经度">
        <el-input v-model="form.longitude"></el-input>
      </el-form-item>
      <el-form-item label="震源纬度">
        <el-input v-model="form.latitude"></el-input>
      </el-form-item>
      <el-form-item label="地震发生时间">
        <el-date-picker
            v-model="form.earthquakeTime"
            type="datetime"
            placeholder="选择地震发生时间"
            value-format="YYYY-MM-DD HH:mm:ss"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">提交</el-button>
        <el-button @click="addEarthquakeVisible=false">取消</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script>
export default {
  name: "AddEarthquake",
  data(){
    return {
      addEarthquakeVisible:false,
      form: {
        earthquakeName: '',
        magnitude: '',
        longitude: '',
        latitude: '',
        earthquakeTime: '',
      },
    }
  },
  methods:{
    onSubmit() {
      let that=this;
      that.$axios.get('earthquakeInfo/addEarthquake?'+that.$qs.stringify(that.form))
          .then(res=>{
            if(res.data==='success')
            {
              that.$message('添加成功');
              that.getEarthquakeList();
              this.addEarthquakeVisible=false;
            }
            else
            {
              that.$message('添加失败');
            }
          })
    },
  }
}
</script>

<style scoped>

</style>
