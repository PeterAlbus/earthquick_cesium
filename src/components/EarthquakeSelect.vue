<template>
  <el-button type="primary" icon="el-icon-search" round @click="earthquakeSelectVisible=true" class="toolbar-item" style="margin: 5px">地震列表</el-button>
  <el-dialog
      v-model="earthquakeSelectVisible"
      title="选择地震"
      width="50%"
      style="z-index: 9999"
  >
    <el-input v-model="searchEarthquake" placeholder="输入地震名称搜索" />
    <div class="el-dialog-div">
      <el-descriptions
          :title="item.earthquakeName"
          :column="3"
          v-for="(item,index) in earthquakeSearchResult"
          border
      >
        <template #extra>
          <el-button type="primary" size="small" v-if="index!==selectedEarthquakeIndex" v-on:click="$emit('changeSelect',index)">选择</el-button>
          <el-button type="info" size="small" v-if="selectedEarthquakeIndex===index">已选择</el-button>
          <el-button type="danger" size="small" v-on:click="deleteEarthquake(item.earthquakeId)">删除</el-button>
        </template>
        <el-descriptions-item>
          <template #label>
            <i class="el-icon-info"></i>
            地震名称
          </template>
          {{ item.earthquakeName }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <i class="el-icon-s-data"></i>
            震级
          </template>
          {{item.magnitude}}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <i class="el-icon-location-outline"></i>
            震源经纬度
          </template>
          ({{ item.longitude }},{{item.latitude}})
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <i class="el-icon-tickets"></i>
            最高烈度
          </template>
          {{item.highIntensity}}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <i class="el-icon-timer"></i>
            地震发生时间
          </template>
          {{ item.earthquakeTime }}
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </el-dialog>
</template>

<script>
export default {
  props: ['earthquakeInfoList','selectedEarthquakeIndex'],
  emits: ['changeSelect'],
  name: "EarthquakeSelect",
  data() {
    return {
      earthquakeSelectVisible:false,
      searchEarthquake: "",
    }
  },
  methods:{
    deleteEarthquake(id){
      let that=this;
      that.$axios.get('earthquakeInfo/deleteById?earthquakeId='+id)
          .then(res=>{
            if(res.data==='success')
            {
              that.getEarthquakeList();
            }
          })
    },
  },
  computed:{
    earthquakeSearchResult: function(){
      let result=[]
      if(this.searchEarthquake==='')
      {
        return this.earthquakeInfoList
      }
      for(let i=0;i<this.earthquakeInfoList.length;i++)
      {
        let str=this.earthquakeInfoList[i].earthquakeName
        if(str.search(this.searchEarthquake)!==-1)
        {
          result.push(this.earthquakeInfoList[i])
        }
      }
      return result
    },
  }
}
</script>

<style scoped>
.el-dialog-div{
  height: 50vh;
  overflow: auto;
  padding: 10px;
}

::-webkit-scrollbar {
  width: 6px;
  background-color: #F5F5F5;
}

::-webkit-scrollbar-thumb {
  background-color: #6FB0FC;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgb(0 0 0 / 30%);
  background-color: #F5F5F5;
}
</style>
