<template>
  <el-button type="primary" icon="el-icon-search" round @click="earthquakeSelectVisible=true" class="toolbar-item" style="margin: 5px">地震列表</el-button>
  <el-dialog
      v-model="earthquakeSelectVisible"
      title="选择地震"
      width="50%"
  >
    <div>
      <el-input v-model="searchEarthquake" placeholder="输入地震名称搜索"/>
    </div>

    <div class="el-dialog-div">
      <el-collapse>
        <el-collapse-item title="条件筛选">
          <el-form>
            <el-form-item label="时间范围">
              <el-date-picker
                  v-model="timeRange"
                  :shortcuts="shortcuts"
                  type="datetimerange"
                  range-separator="到"
                  start-placeholder="最早日期"
                  end-placeholder="最晚日期"
              >
              </el-date-picker>
            </el-form-item>
            <el-form-item label="限制区域">
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
              <el-button round type="primary" @click="selectEarthquakeByCondition">筛选</el-button>
              <el-button round type="success" @click="$emit('updateList')">显示全部</el-button>
            </div>
          </el-form>
          <br/>
        </el-collapse-item>
      </el-collapse>
      <el-descriptions
          :title="item.earthquakeName"
          :column="3"
          v-for="(item,index) in earthquakeSearchResult"
          border
      >
        <template #extra>
          <el-button type="primary" size="small" v-if="getRealIndex(index)!==selectedEarthquakeIndex" v-on:click="$emit('changeSelect',getRealIndex(index));earthquakeSelectVisible=false">选择</el-button>
          <el-button type="info" size="small" v-if="selectedEarthquakeIndex===getRealIndex(index)">已选择</el-button>
          <el-button type="success" size="small" v-on:click="$emit('jumpTo',item.longitude,item.latitude,100000);earthquakeSelectVisible=false">跳转</el-button>
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
  emits: ['changeSelect','updateList','newList','jumpTo'],
  name: "EarthquakeSelect",
  data() {
    return {
      earthquakeSelectVisible:false,
      searchEarthquake: "",
      area: "any",
      areas: [
        {
          value: "any",
          label: "无限制"
        },
        {
          value:"china",
          label:"中国附近"
        }
      ],
      timeRange:[
        new Date(2000, 10, 10, 10, 10),
        new Date(),
      ],
      shortcuts:[
        {
          text: '最近一天',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24)
            return [start, end]
          }
        },
        {
          text: '最近一周',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            return [start, end]
          }
        },
        {
          text: '最近一个月',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            return [start, end]
          }
        },
        {
          text: '最近3个月',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            return [start, end]
          }
        },
        {
          text: '最近半年',
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 180)
            return [start, end]
          }
        },
        {
          text: '最近一年',
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
    getRealIndex:function (){
      return function (index){
        let realIndex=0;
        for(let i=0;i<this.earthquakeInfoList.length;i++)
        {
          if(this.earthquakeSearchResult[index].earthquakeId===this.earthquakeInfoList[i].earthquakeId)
          {
            realIndex=i
            break
          }
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
