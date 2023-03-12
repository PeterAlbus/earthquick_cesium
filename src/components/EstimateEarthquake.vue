<template>
  <el-button type="danger" @click="getEarthquakeSituation" round style="margin: 5px" icon="el-icon-document"
             :loading="analyzing"
  >{{ $t('EstimateEarthquake.estimate') }}</el-button>
  <el-dialog
      v-model="dialogVisible"
      :title="$t('EstimateEarthquake.quickAnalyze')"
      width="60vw"
      center
  >
    <el-descriptions
        :title="earthquake.earthquakeName"
        :column="2"
        border
    >
      <el-descriptions-item>
        <template #label>
          <i class="el-icon-user"></i>
          {{ $t('EstimateEarthquake.name') }}
        </template>
        {{ earthquake.earthquakeName }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <i class="el-icon-s-data"></i>
          {{ $t('EstimateEarthquake.level') }}
        </template>
        {{earthquake.magnitude}}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <i class="el-icon-location-outline"></i>
          {{ $t('EstimateEarthquake.lonlat') }}
        </template>
        ({{ earthquake.longitude }},{{earthquake.latitude}})
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <i class="el-icon-tickets"></i>
          {{ $t('EstimateEarthquake.highIntensity') }}
        </template>
        {{earthquake.highIntensity}}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <i class="el-icon-office-building"></i>
          {{ $t('EstimateEarthquake.time') }}
        </template>
        {{ earthquake.earthquakeTime }}
      </el-descriptions-item>
    </el-descriptions>
    <br/>
    <el-collapse>
      <el-collapse-item name="1">
        <template #title>
          {{ $t('EstimateEarthquake.population') }}&nbsp{{estimate.population}}{{ $t('EstimateEarthquake.referenceOnly') }}
        </template>
      <div>
            我们以建筑物损坏率为主要参数，选择指数函数作为地震人员伤亡的基本模型。测定结果如下公式所示。
            <br/>
            <code>N = 0.461 * αm * αden * αtime * αall * e^(12.285⋅Bdr)</code>
            <br/>
            其中N为伤亡人数，Bdr为建筑物损坏比例，αm,αden、αtime和αall分别为地震震级和强度、人口密度、地震发生时间和区域整体抗震水平的修正系数。
            <br/>
            而对于经济损失方面的预估，我们选用了基于震中烈度的评估模型
            <br/>
            <code>lg L = 0.844 44I － 1.831</code>
            <br/>
            L 为地震直接经济损失，I 为震中烈度.
            利用 MATLAB 进行拟合优度分析，确定系数 R － square = 0． 957 6 ＞ 0． 95，说明此次拟合结果良好
      </div>
      </el-collapse-item>
    </el-collapse>
    <br/>

    <div style="height: 32.5vh">
      <div style="float: left;">
        <div :style="{'--color': ecoColor}" style="float: left" class="circle"/>
        <p style="font-size: large" >&nbsp;{{ $t('EstimateEarthquake.economy') }}{{ estimate.predictEconomy }} {{ $t('EstimateEarthquake.unitYuan') }}</p>
        <br/>
        <el-image :src="require('../assets/predictdeath.png')"></el-image>
      </div>
      <div style="float: right;">
        <div :style="{'--color': deathColor}" style="float:left;" class="circle"/>
        <p style="font-size: large">&nbsp;{{ $t('EstimateEarthquake.death') }}{{ estimate.predictDeath }}{{ $t('EstimateEarthquake.unitPerson') }}</p>
        <br/>
        <el-image :src="require('../assets/predictdeath.png')"></el-image>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  props:['earthquake'],
  name: "EstimateEarthquake",
  data(){
    return {
      dialogVisible:false,
      analyzing:false,
      estimate:{
        predictDeath:'',
        predictEconomy:'',
        population:'',
      },
      deathColor: '#00B14E',
      ecoColor: '#00B14E',
    }
  },
  methods:{
    getEarthquakeSituation(){
      let that=this
      that.analyzing=true
      that.$axios.get('estimate/getAnalyzeResult?earthquakeId='+this.earthquake.earthquakeId)
          .then(res=>{
            let temp_analyze = res.data;
            let temp_predictDeath= temp_analyze.predictDeath;
            let temp_predictEconomy = temp_analyze.predictEconomy;
            that.estimate.population = temp_analyze.population;
            if(temp_predictDeath <= 1){
              that.estimate.predictDeath = '0-1';
              that.deathColor = '#00B14E'
            }
            else if(temp_predictDeath <= 10){
              that.estimate.predictDeath = '1-10';
              that.deathColor = '#FFFF00'
            }
            else if(temp_predictDeath <= 100){
              that.estimate.predictDeath = '10-100';
              that.deathColor = '#FFFF00'
            }
            else if(temp_predictDeath <= 1000){
              that.estimate.predictDeath = '100-1000';
              that.deathColor = '#FF9900'
            }
            else {
              that.estimate.predictDeath = '大于1000';
              that.deathColor = '#FF0000'
            }
            if(temp_predictEconomy <= 1){
              that.estimate.predictEconomy = temp_predictEconomy;
              that.ecoColor = '#00B14E'
            }
            else if(temp_predictEconomy <= 10){
              that.estimate.predictEconomy = temp_predictEconomy;
              that.ecoColor = '#FFFF00'
            }
            else if(temp_predictEconomy <= 100){
              that.estimate.predictEconomy = temp_predictEconomy;
              that.ecoColor = '#FFFF00'
            }
            else if(temp_predictEconomy <= 1000){
              that.estimate.predictEconomy = temp_predictEconomy;
              that.ecoColor = '#FF9900'
            }
            else {
              that.estimate.predictEconomy = temp_predictEconomy;
              that.ecoColor = '#FF0000'
            }
            that.dialogVisible = true;
            that.analyzing=false
          })
          .catch(err=>{
            that.analyzing=false
            this.$message.warning(this.$t('EstimateEarthquake.error'))
          })
    },
  }
}
</script>

<style scoped>
.circle {
  border-radius: 50%;
  width: 62.5px;
  height: 62.5px;
  background: var(--color);
  /* 宽度和高度需要相等 */
}
</style>
