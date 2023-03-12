<template>
  <el-button type="primary" icon="el-icon-search" round @click="earthquakeSelectVisible=true" class="toolbar-item" style="margin: 5px">
    {{ $t('EarthquakeSelect.list') }}</el-button>
  <el-dialog
      v-model="earthquakeSelectVisible"
      :title="$t('EarthquakeSelect.selectEarthquake')"
      width="50%"
  >
    <div>
      <el-input v-model="searchEarthquake" :placeholder="$t('EarthquakeSelect.enterName')"/>
    </div>

    <div class="el-dialog-div">
      <el-collapse>
        <el-collapse-item :title="$t('EarthquakeSelect.filtering')">
          <el-form>
            <el-form-item :label="$t('EarthquakeSelect.range')">
              <el-date-picker
                  v-model="timeRange"
                  :shortcuts="shortcuts"
                  type="datetimerange"
                  :range-separator="$t('EarthquakeSelect.to')"
                  :start-placeholder="$t('EarthquakeSelect.startDate')"
                  :end-placeholder="$t('EarthquakeSelect.endDate')"
              >
              </el-date-picker>
            </el-form-item>
            <el-form-item :label="$t('EarthquakeSelect.area')">
              <el-select v-model="area" placeholder="Select">
                <el-option
                    v-for="item in areas"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <div style="float: right">
              <el-button round type="primary" @click="selectEarthquakeByCondition">{{ $t('EarthquakeSelect.search') }}</el-button>
              <el-button round type="success" @click="$emit('updateList')">{{ $t('EarthquakeSelect.showAll') }}</el-button>
            </div>
          </el-form>
          <br/>
        </el-collapse-item>
      </el-collapse>
      <el-descriptions
          :title="item.earthquakeName"
          :column="3"
          v-for="(item,index) in currentPageEarthquake"
          border
      >
        <template #extra>
          <el-button type="primary" size="small" v-if="getRealIndex(index)!==selectedEarthquakeIndex"
                     v-on:click="$emit('changeSelect',getRealIndex(index));earthquakeSelectVisible=false">
            {{ $t('EarthquakeSelect.select') }}</el-button>
          <el-button type="info" size="small" v-if="selectedEarthquakeIndex===getRealIndex(index)">
            {{ $t('EarthquakeSelect.selected') }}</el-button>
          <el-button type="success" size="small"
                     v-on:click="$emit('jumpTo',item.longitude,item.latitude,100000);earthquakeSelectVisible=false">
            {{ $t('EarthquakeSelect.jump') }}</el-button>
          <el-button type="danger" size="small" v-on:click="deleteEarthquake(item.earthquakeId)">
            {{ $t('EarthquakeSelect.delete') }}</el-button>
        </template>
        <el-descriptions-item>
          <template #label>
            <i class="el-icon-info"></i>
            {{ $t('EarthquakeSelect.name') }}
          </template>
          {{ item.earthquakeName }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <i class="el-icon-s-data"></i>
            {{ $t('EarthquakeSelect.level') }}
          </template>
          {{item.magnitude}}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <i class="el-icon-location-outline"></i>
            {{ $t('EarthquakeSelect.lonlat') }}
          </template>
          ({{ item.longitude }},{{item.latitude}})
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <i class="el-icon-tickets"></i>
            {{ $t('EarthquakeSelect.highIntensity') }}
          </template>
          {{item.highIntensity}}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <i class="el-icon-timer"></i>
            {{ $t('EarthquakeSelect.time') }}
          </template>
          {{ item.earthquakeTime }}
        </el-descriptions-item>
      </el-descriptions>
      <el-pagination layout="prev, pager, next, jumper, ->,  total" v-model:current-page="currentPage" :total="earthquakeSearchResult.length"></el-pagination>
    </div>
  </el-dialog>
</template>

<script>
export default {
  props: ['earthquakeInfoList','selectedEarthquakeIndex'],
  emits: ['changeSelect','updateList','newList','jumpTo'],
  name: "EarthquakeSelect",
  data() {
    return {
      currentPage: 1,
      earthquakeSelectVisible:false,
      searchEarthquake: "",
      area: "any",
      areas: [
        {
          value: "any",
          label: this.$t('EarthquakeSelect.unLimited')
        },
        {
          value:"china",
          label: this.$t('EarthquakeSelect.china')
        }
      ],
      timeRange:[
        new Date(2000, 10, 10, 10, 10),
        new Date(),
      ],
      shortcuts:[
        {
          text: this.$t('EarthquakeSelect.today'),
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24)
            return [start, end]
          }
        },
        {
          text: this.$t('EarthquakeSelect.week'),
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            return [start, end]
          }
        },
        {
          text: this.$t('EarthquakeSelect.month'),
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            return [start, end]
          }
        },
        {
          text: this.$t('EarthquakeSelect.threeMonth'),
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            return [start, end]
          }
        },
        {
          text: this.$t('EarthquakeSelect.halfYear'),
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 180)
            return [start, end]
          }
        },
        {
          text: this.$t('EarthquakeSelect.year'),
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 365)
            return [start, end]
          }
        }
      ]
    }
  },
  methods:{
    deleteEarthquake(id){
      let that=this;
      that.$axios.get('earthquakeInfo/deleteById?earthquakeId='+id)
          .then(res=>{
            if(res.data==='success')
            {
              that.$emit('updateList')
            }
          })
    },
    selectEarthquakeByCondition(){
      let that=this;
      let start=that.dateFtt("yyyy-MM-dd hh:mm:ss",that.timeRange[0])
      let end=that.dateFtt("yyyy-MM-dd hh:mm:ss",that.timeRange[1])
      that.$axios.get('earthquakeInfo/getEarthquakeByCondition?area='+that.area+'&start='+start+'&end='+end)
          .then(res=>{
            console.log(res.data)
            that.$emit('newList',res.data)
          })
    },
    dateFtt(fmt,date) {
      //author: meizz
      var o = {
        "M+" : date.getMonth()+1,                 //月份
        "d+" : date.getDate(),                    //日
        "h+" : date.getHours(),                   //小时
        "m+" : date.getMinutes(),                 //分
        "s+" : date.getSeconds(),                 //秒
        "q+" : Math.floor((date.getMonth()+3)/3), //季度
        "S"  : date.getMilliseconds()             //毫秒
      };
      if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));
      for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
          fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
      return fmt;
    }
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
    currentPageEarthquake: function(){
      return this.earthquakeSearchResult.slice((this.currentPage-1)*10,this.currentPage*10)
    },
    getRealIndex:function (){
      let that=this
      return function (index){
        let realIndex=0;
        let i=0;
        for(let earthquake of that.earthquakeInfoList)
        {
          if(that.earthquakeSearchResult[index].earthquakeId===earthquake.earthquakeId)
          {
            realIndex=i
            break
          }
          i++
        }
        return realIndex
      }
    }
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
