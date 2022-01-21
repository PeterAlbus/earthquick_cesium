<template>
  <el-row ref="viewerContainer" class="demo-viewer">
    <vc-viewer
        ref="vcViewer"
        :animation="animation"
        :baseLayerPicker="baseLayerPicker"
        :timeline="timeline"
        :fullscreenButton="fullscreenButton"
        :fullscreenElement="fullscreenElement"
        :infoBox="infoBox"
        :selectionIndicator="false"
        :showCredit="showCredit"
        @cesiumReady="onCesiumReady"
        @ready="onViewerReady"
    >
      <vc-selection-indicator ref="selectionIndicator" @pickEvt="pickEvt"></vc-selection-indicator>
      <vc-measurements
          @measureEvt="measureEvt"
          @activeEvt="activeEvt"
          @editorEvt="editorEvt"
          @mouseEvt="mouseEvt"
          ref="measurementsRef"
          position="bottom-left"
          :mainFabOpts="measurementFabOptions1"
          :offset="[20, 80]"
          :editable="editable"
      >
      </vc-measurements>
      <vc-datasource-geojson
          ref="datasourceRef"
          data="/cont_mmi.json"
          @ready="onDatasourceReady"
          :show="showGeojson"
          stroke="red"
          @click="onClicked"
          :entities="entities"
      ></vc-datasource-geojson>
      <vc-datasource-custom name="epicenter" :entities="entities" @click="onClicked" :show="showEpicenter">
        <vc-entity
            :position="[item.longitude,item.latitude, 0]"
            :description="'震源位置:'+item.latitude+','+item.longitude+',震级:'+item.magnitude"
            :id="item.earthquakeId.toString()"
            v-for="item in earthquakeInfoList"
        >
          <vc-graphics-point ref="point1" color="red" :pixelSize="2*item.magnitude"></vc-graphics-point>
        </vc-entity>
      </vc-datasource-custom>
      <vc-datasource-custom name="intensity" @click="onClicked" :show="showIntensity">
        <vc-entity
            :position="[earthquakeInfoList[selectedEarthquakeIndex].longitude,earthquakeInfoList[selectedEarthquakeIndex].latitude, 0]"
            :description="'震源位置:'+earthquakeInfoList[selectedEarthquakeIndex].latitude+','+earthquakeInfoList[selectedEarthquakeIndex].longitude+',震级:'+earthquakeInfoList[selectedEarthquakeIndex].magnitude"
            id="earthquake"
        >
          <vc-graphics-point ref="point1" color="red" :pixelSize="2*earthquakeInfoList[selectedEarthquakeIndex].magnitude"></vc-graphics-point>
        </vc-entity>
        <vc-entity
            @click="onClicked"
            :position="[earthquakeInfoList[selectedEarthquakeIndex].longitude,earthquakeInfoList[selectedEarthquakeIndex].latitude,0]"
            :description="'最外圈烈度:'+item.intensity"
            :id="'intensity'+item.intensity+'('+item.longRadius+','+item.shortRadius+')'"
            v-for="item in earthquakeInfoList[selectedEarthquakeIndex].intensityLineList"
        >
          <vc-graphics-ellipse
              :semiMinorAxis="item.longRadius*1000"
              :semiMajorAxis="item.shortRadius*1000"
              :outlineColor="[255, 70, 0, 125]"
              :material="[255, (10-item.intensity)*30, 0, 125]"
              :outlineWidth="5"
              :rotation="item.rotation"
              :fill="true"
              :outline="true">
          </vc-graphics-ellipse>
        </vc-entity>
      </vc-datasource-custom>
<!--      <vc-provider-terrain-tianditu token="125c8a9d540afbc15a4feb04d9c2e8ef"></vc-provider-terrain-tianditu>-->
      <vc-layer-imagery :alpha="alpha" :brightness="brightness" :contrast="contrast" :sortOrder="20">
        <vc-provider-imagery-tianditu mapStyle="cva_w" token="125c8a9d540afbc15a4feb04d9c2e8ef"></vc-provider-imagery-tianditu>
      </vc-layer-imagery>
      <vc-layer-imagery :alpha="alpha" :brightness="brightness" :contrast="contrast" :sortOrder="10">
        <vc-provider-imagery-tianditu :mapStyle="mapStyle" token="125c8a9d540afbc15a4feb04d9c2e8ef" ref="provider"></vc-provider-imagery-tianditu>
      </vc-layer-imagery>

<!--      <vc-primitive-tileset-->
<!--          ref="primitive"-->
<!--          url="/tileset/tileset.json"-->
<!--          @readyPromise="onReadyPromise"-->
<!--          @click="onClicked"-->
<!--      >-->
<!--      </vc-primitive-tileset>-->
      <vc-navigation :offset="offset" @compass-evt="onNavigationEvt" :otherOpts="otherOpts" @zoom-evt="onNavigationEvt"></vc-navigation>
      <vc-ajax-bar></vc-ajax-bar>
    </vc-viewer>
    <el-row class="demo-toolbar">
      <el-select v-model="mapStyle" placeholder="请选择" class="toolbar-item">
        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"> </el-option>
      </el-select>
      <el-popover placement="bottom" trigger="click">
        <template #reference>
          <el-button type="default" icon="el-icon-menu" round class="toolbar-item">图层控制</el-button>
        </template>
        <el-checkbox v-model="showGeojson" label="geojson"></el-checkbox><br/>
        <el-checkbox v-model="showIntensity" label="烈度图"></el-checkbox><br/>
        <el-checkbox v-model="showEpicenter" label="震源"></el-checkbox>
      </el-popover>
      <el-button type="primary" round
                 v-on:click="cameraTo(earthquakeInfoList[selectedEarthquakeIndex].longitude,earthquakeInfoList[selectedEarthquakeIndex].latitude,80000)"
                 icon="el-icon-s-flag"
                 class="toolbar-item">跳转到所选震区</el-button>
      <el-button type="primary" icon="el-icon-search" round @click="earthquakeSelectVisible=true" class="toolbar-item">地震列表</el-button>
      <el-dialog
          v-model="earthquakeSelectVisible"
          title="选择地震"
          width="50%"
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
              <el-button type="primary" size="small" v-if="index!==selectedEarthquakeIndex" v-on:click="selectEarthquakeIndex(index)">选择</el-button>
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
        </div >
      </el-dialog>
<!--https://restapi.amap.com/v3/geocode/regeo?output=json&location=100.008,25.727&key=e21feddaeef263e2506376a2ddbb994e&radius=1000&extensions=all-->
      <el-button type="danger" round @click="getEarthquakeSituation" class="toolbar-item" icon="el-icon-document">评估地震情况</el-button>
      <el-dialog
          v-model="dialogVisible"
          title="地震灾情快速评估"
          width="30%"
      >
        <p>
          <span>预估经济损失:{{ predict.predictEconomy }}亿元</span>
        </p>
        <p>
          <span>预估死亡人数:{{ predict.predictDeath }}人</span>
        </p>
        <el-descriptions
            :title="earthquakeInfoList[selectedEarthquakeIndex].earthquakeName"
            :column="2"
            border
        >
          <el-descriptions-item>
            <template #label>
              <i class="el-icon-user"></i>
              地震名称
            </template>
            {{ earthquakeInfoList[selectedEarthquakeIndex].earthquakeName }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <i class="el-icon-s-data"></i>
              震级
            </template>
            {{earthquakeInfoList[selectedEarthquakeIndex].magnitude}}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <i class="el-icon-location-outline"></i>
              震源经纬度
            </template>
            ({{ earthquakeInfoList[selectedEarthquakeIndex].longitude }},{{earthquakeInfoList[selectedEarthquakeIndex].latitude}})
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <i class="el-icon-tickets"></i>
              最高烈度
            </template>
            {{earthquakeInfoList[selectedEarthquakeIndex].highIntensity}}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <i class="el-icon-office-building"></i>
              地震发生时间
            </template>
            {{ earthquakeInfoList[selectedEarthquakeIndex].earthquakeTime }}
          </el-descriptions-item>
        </el-descriptions>
      </el-dialog>
      <el-button type="success" round @click="addEarthquakeVisible=true" class="toolbar-item" icon="el-icon-plus">添加地震</el-button>
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
    </el-row>
  </el-row>
</template>

<script>
import {getCurrentInstance, reactive, ref, onMounted } from "vue";

export default {
  name: "Cesium",
  setup() {
    const dialogVisible = ref(false)
    const earthquakeSelectVisible = ref(false)
    const addEarthquakeVisible = ref(false)
    // state
    const instance = getCurrentInstance()
    const provider = ref(null)
    const alpha = ref(1)
    const brightness = ref(1)
    const contrast = ref(1)
    const options = [
      {
        value: 'img_c',
        label: '全球影像地图服务(经纬度)'
      },
      {
        value: 'img_w',
        label: '全球影像地图服务(墨卡托)'
      },
      {
        value: 'vec_c',
        label: '全球矢量地图服务(经纬度)'
      },
      {
        value: 'vec_w',
        label: '全球矢量地图服务(墨卡托)'
      },
      {
        value: 'ter_c',
        label: '全球地形晕渲服务(经纬度)'
      },
      {
        value: 'ter_w',
        label: '全球地形晕渲服务(墨卡托)'
      },
      {
        value: 'ibo_c',
        label: '全球境界(经纬度)'
      },
      {
        value: 'ibo_w',
        label: '全球境界(墨卡托)'
      }
    ]
    const datasourceRef = ref(null)
    const mapStyle = ref('img_w')
    const entities = reactive([])

    const onClicked = e => {

    }
    const onDatasourceReady = ({ Cesium, viewer, cesiumObject }) => {

    }
    const unload = () => {
      provider.value.unload()
    }
    const reload = () => {
      provider.value.reload()
    }
    const load = () => {
      provider.value.load()
    }


    return {
      provider,
      unload,
      reload,
      load,
      alpha,
      brightness,
      contrast,
      options,
      mapStyle,
      onClicked,
      onDatasourceReady,
      datasourceRef,
      entities,
      dialogVisible,
      addEarthquakeVisible,
      earthquakeSelectVisible
    }
  },
  data() {
    return {
      form: {
        earthquakeName: '',
        magnitude: '',
        longitude: '',
        latitude: '',
        earthquakeTime: '',
      },
      //earthquakeInfo
      earthquakeInfoList:[{
        earthquakeId:1,
        earthquakeName:'云南大理地震',
        magnitude:6.1,
        highIntensity:7,
        longitude:25.727,
        latitude:100.008,
        earthquakeTime:'2021-12-02 10:24:07',
        intensityLineList:[{
          lindId:1,
          longRadius:11.143207166465402,
          shortRadius:6.045067370310756,
          intensity:5,
          angle:-20,
          earthquakeId:1
        }]
      }],
      predict:{
        predictDeath:0,
        predictEconomy:0
      },
      selectedEarthquakeIndex:0,
      //mesure
      measurementFabOptions1: {
        direction: 'right'
      },
      editable: false,
      //viwer
      loading: true,
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      infoBox: true,
      showCredit: false,
      fullscreenElement: document.body,
      offset: [10, 25],
      otherOpts: {
        offset: [0, 32],
        position: 'bottom-right'
      },
      showIntensity:true,
      showGeojson:false,
      showEpicenter:false,
      searchEarthquake:''
    }
  },
  watch: {
    timeline(val) {
      this.otherOpts.offset = val ? [0, 30] : this.fullscreenButton ? [30, 5] : [0, 5]
    },
    fullscreenButton(val) {
      if (!this.timeline && !val) {
        this.otherOpts.offset = [0, 5]
      } else if (!this.timeline && val) {
        this.otherOpts.offset = [30, 5]
      }
    }
  },
  created() {
    this.getEarthquakeList();
  },
  mounted() {
    this.$refs.vcViewer.createPromise.then(({ Cesium, viewer }) => {
      console.log('viewer is loaded.')
      viewer.scene.globe.depthTestAgainstTerrain = false;
      let iframe = document.getElementsByClassName('cesium-infoBox-iframe')[0]
      iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
      iframe.setAttribute('src', '')
      // let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      // let that=this;
      // handler.setInputAction(function (event) {
      //   that.getPosition(viewer,event);
      // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    })
  },
  methods: {
    getEarthquakeList(){
      let that=this;
      that.$axios.get("earthquakeInfo/getAllEarthquake")
          .then(res=>{
            console.log('earthquakeInfoList',res)
            that.earthquakeInfoList=res.data;
            that.selectedEarthquakeIndex=0;
          })
    },
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
    getEarthquakeSituation(){
      let that=this;
      that.$axios.get('earthquakeInfo/getDeathPredict?earthquakeId='+that.earthquakeInfoList[that.selectedEarthquakeIndex].earthquakeId)
      .then(res=>{
        that.predict.predictDeath=res.data;
        that.$axios.get('earthquakeInfo/getEconomyPredict?earthquakeId='+that.earthquakeInfoList[that.selectedEarthquakeIndex].earthquakeId)
        .then(res=>{
          that.predict.predictEconomy=res.data;
          that.dialogVisible = true;
        })
      })
    },
    selectEarthquakeIndex(index){
      this.selectedEarthquakeIndex=index;
      this.earthquakeSelectVisible=false;
    },
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
    getPosition(viewer,event){
      let position = viewer.scene.pickPosition(event.position);
      let cartographic = Cesium.Cartographic.fromCartesian(position);
      let longitude = Cesium.Math.toDegrees(cartographic.longitude); //经度
      let latitude = Cesium.Math.toDegrees(cartographic.latitude); //纬度
      let height = cartographic.height; //高度
      console.log("经纬度："+longitude,latitude,height);
    },
    switchShow(){
      this.showIntensity=!this.showIntensity
    },
    onReadyPromise(tileset, viewer){
      const cartographic = Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center)
      const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height)
      const offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0)
      const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3())
      tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation)
    },
    measureEvt(e, viewer) {
      console.log(e)
      const restoreCursor = getComputedStyle(viewer.canvas).cursor
      if (e.finished) {
        this.drawing = false
        if (e.type === 'move') {
          viewer.canvas.setAttribute('style', `cursor: ${this.restoreCursorMove}`)
        }
      } else {
        this.drawing = true
        if (e.type === 'move') {
          viewer.canvas.setAttribute('style', 'cursor: move')
        }
        if (e.type === 'new') {
          viewer.canvas.setAttribute('style', 'cursor: crosshair')
        }
      }
    },
    activeEvt(e, viewer) {
      console.log(e)
      viewer.canvas.setAttribute('style', `cursor: ${e.isActive ? 'crosshair' : 'auto'}`)
      if (!e.isActive) {
        this.drawing = false
        this.restoreCursorMove = 'auto'
      }
    },
    editorEvt(e, viewer) {
      console.log(e)
      if (e.type === 'move') {
        const restoreCursor = getComputedStyle(viewer.canvas).cursor
        viewer.canvas.setAttribute('style', 'cursor: move')
        this.drawing = true
      }
    },
    mouseEvt(e, viewer) {
      console.log(e)
      const restoreCursor = getComputedStyle(viewer.canvas).cursor
      if (!this.drawing) {
        if (e.type === 'onmouseover') {
          this.restoreCursorMove = restoreCursor
          viewer.canvas.setAttribute('style', 'cursor: pointer')
        } else {
          viewer.canvas.setAttribute('style', `cursor: ${this.restoreCursorMove || 'auto'}`)
        }
      }
    },
    cameraTo(lat,lon,height){
      let viewer=this.$refs.vcViewer.getCesiumObject();
      viewer.camera.flyTo(
          {
            destination : Cesium.Cartesian3.fromDegrees(lat,lon,height),
            orientation : {
              heading : Cesium.Math.toRadians(0.0),
              pitch : Cesium.Math.toRadians(-90.0),
              roll : 0.0
            }
          }
      )
    },
    pickEvt(e){
      console.log('pickEvt',e)
    },
    onViewerReady({ Cesium, viewer }) {
      this.loading = false
    },
    onCesiumReady (e) {
      console.log(e)
    },
    onNavigationEvt(e) {
      console.log(e)
    },
    onEntityClick(e) {
      console.log('onEntityClick',e)
    },
    // onLeftClick(e) {
    //   console.log('onLeftClick',e)
    //
    // }
  },
  computed:{
    earthquakeSearchResult: function(){
      let result=[];
      if(this.searchEarthquake==='')
      {
        return this.earthquakeInfoList;
      }
      for(let i=0;i<this.earthquakeInfoList.length;i++)
      {
        let str=this.earthquakeInfoList[i].earthquakeName;
        if(str.search(this.searchEarthquake)!==-1)
        {
          result.push(this.earthquakeInfoList[i]);
        }
      }
      return result;
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

.demo-toolbar {
  position: absolute;
  left: 1%;
  top: 1%;
  min-width: 185px;
  z-index: 100;
  color: #fff!important;
  background-color: rgba(0,0,0,.2);
}

.toolbar-item{
  margin: 5px;
}

.demo-viewer{

  width:100%;
  height:100vh;
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
