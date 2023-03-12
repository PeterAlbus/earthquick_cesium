<template>
  <el-button type="success" round @click="addEarthquakeVisible=true" style="margin: 5px" icon="el-icon-plus">
    {{ $t('AddEarthquake.add') }}</el-button>
  <el-dialog
      v-model="addEarthquakeVisible"
      :title="$t('AddEarthquake.add')"
      width="50%"
  >
    <el-form ref="form" :model="form" label-width="120px">
      <el-form-item :label="$t('AddEarthquake.name')">
        <el-input v-model="form.earthquakeName"></el-input>
      </el-form-item>
      <el-form-item :label="$t('AddEarthquake.level')">
        <el-input v-model="form.magnitude"></el-input>
      </el-form-item>
      <el-form-item :label="$t('AddEarthquake.lon')">
        <el-input v-model="form.longitude"></el-input>
      </el-form-item>
      <el-form-item :label="$t('AddEarthquake.lat')">
        <el-input v-model="form.latitude"></el-input>
      </el-form-item>
      <el-form-item :label="$t('AddEarthquake.time')">
        <el-date-picker
            v-model="form.earthquakeTime"
            type="datetime"
            :placeholder="$t('AddEarthquake.selectTime')"
            value-format="YYYY-MM-DD HH:mm:ss"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">{{ $t('AddEarthquake.submit') }}</el-button>
        <el-button @click="addEarthquakeVisible=false">{{ $t('AddEarthquake.cancel') }}</el-button>
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
              that.$message(this.$t('AddEarthquake.success'));
              that.getEarthquakeList();
              this.addEarthquakeVisible=false;
            }
            else
            {
              that.$message(this.$t('AddEarthquake.fail'));
            }
          })
    },
  }
}
</script>

<style scoped>

</style>
