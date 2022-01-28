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
      <!-- hyc：增加图标位置 -->
      <vc-collection-primitive
        @click="onClicked"
        :show="showHospital"
        ref="collectionRef"
      >
        <vc-collection-billboard
          :billboards="billboards1"
        ></vc-collection-billboard>
      </vc-collection-primitive>
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
        <el-checkbox v-model="showHospital" label="显示医院"></el-checkbox>
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
        </div>
      </el-dialog>
<!--https://restapi.amap.com/v3/geocode/regeo?output=json&location=100.008,25.727&key=e21feddaeef263e2506376a2ddbb994e&radius=1000&extensions=all-->
      <el-button type="danger" @click="getEarthquakeSituation" round class="toolbar-item" icon="el-icon-document">评估地震情况</el-button>
      <el-dialog
          v-model="dialogVisible"
          title="地震灾情快速评估"
          width="65vw"
          center
      >
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
        <br/>
<!--        <div style="height: 40vh;width: 55vw">-->
<!--          <div ref="bar" style="height:40vh;width:27.5vw;float: left"></div>-->
<!--          <div ref="bar1" style="height:40vh;width:27.5vw;float: right"></div>-->
<!--        </div>-->
        <div style="height: 30vh">
          <div style="float: left;">
              <div :style="{'--color': deathColor}" style="float: left" class="circle"/>
              <p style="font-size: large" >&nbsp预估经济损失:{{ estimate.predictEconomy }}亿元</p>
            <br/>
            <div><img src="../assets/predictdeath.png"></div>
          </div>
          <div style="float: right;">
            <div :style="{'--color': ecoColor}" style="float:left;" class="circle"/>
              <p style="font-size: large">&nbsp预估死亡人数:{{ estimate.predictDeath }}人</p>
            <br/>
            <div><img src="../assets/predictdeath.png"></div>
          </div>
        </div>
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
      <!-- hyc2 -->
      <el-button
        type="primary"
        round
        @click="getPositionRoad"
        class="toolbar-item"
        >开始路径规划</el-button>
    </el-row>
  </el-row>
</template>

<script>
import {getCurrentInstance, reactive, ref, onMounted } from "vue";
import echarts from "echarts";
export default {
  name: "Cesium",
  setup() {
    // hyc:数据初始化
    const collectionRef = ref(null);
    const billboards1 = ref([]);
    const showHospital = ref(false);
    const dialogVisible = ref(false);
    const earthquakeSelectVisible = ref(false);
    const addEarthquakeVisible = ref(false);
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
      earthquakeSelectVisible,
      // hyc
      collectionRef,
      billboards1,
      showHospital,
    };
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
      estimate:{
        predictDeath:'',
        predictEconomy:'',
        population:'',
      },
      deathColor: '#00B14E',
      ecoColor: '#00B14E',
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
      showIntensity: true,
      showGeojson: false,
      showEpicenter: false,
      searchEarthquake: "",
      // hyc2
      num: 0,
      SuccessClick: false,
      startLon: 0.0,
      startLat: 0.0,
      startHei: 0.0,
      longTemp: 0.0,
      latiTemp: 0.0,
      heiTemp: 0.0,
      endLon: 0.0,
      endLat: 0.0,
      endHei: 0.0,
    };
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

      // hyc2
      window.earth = viewer;
      //定义canvas屏幕点击事件
      var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      let that = this;
      handler.setInputAction(function (event) {
        that.getPosition(viewer, event);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    });
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
      that.$axios.get('estimate/getAnalyzeResult?earthquakeId='+that.earthquakeInfoList[that.selectedEarthquakeIndex].earthquakeId)
      .then(res=>{
        let temp_analyze = res.data;
        let temp_predictDeath= temp_analyze.predictDeath;
        let temp_predictEconomy = temp_analyze.predictEconomy;
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
    getPosition(viewer, event) {
      let position = viewer.scene.pickPosition(event.position);
      let cartographic = Cesium.Cartographic.fromCartesian(position);
      this.longTemp = Cesium.Math.toDegrees(cartographic.longitude); //经度
      this.latiTemp = Cesium.Math.toDegrees(cartographic.latitude); //纬度
      this.heiTemp = cartographic.height; //高度
      this.num += 1;
      console.log("经纬度：" + this.longTemp, this.latiTemp, this.heiTemp);
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
      this.loading = false;
      // hyc
      let that = this;
      // for (var i = 0; i < 100; i++) {
      //   let billboard1 = {};
      //   billboard1.position = {
      //     lng: Math.random() * 40 + 85,
      //     lat: Math.random() * 30 + 21,
      //   };
      //   billboard1.image = "https://zouyaoji.top/vue-cesium/favicon.png";
      //   billboard1.scale = 0.1;
      //   that.billboards1.push(billboard1);
      // }
      this.$axios.get("/findAllHospital").then((res) => {
        console.log(res.data.length);
        for (var i = 0; i < res.data.length; i++) {
          let billboard1 = {};
          billboard1.position = {
            lng: res.data[i].lon,
            lat: res.data[i].lat,
          };
          billboard1.image = "/fire_center3.jpg";
          billboard1.scale = 0.1;
          that.billboards1.push(billboard1);
        }
      });
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
    open() {
      this.$nextTick(() => {
        this.draw()
      })
    },
    draw(){
      let echarts = require('echarts')
      let myEcharts = echarts.init(this.$refs.bar)
      let option = {
        title: {
          text: '灾区人口密度以及GDP'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: ['2022年1月']
        },
        yAxis: [
          {
          name: '人口密度(人/km²)',
          position: 'left',
            data: ['oo','0-1','1-10','10-100','100+'],
            axisTick:{ show:false }
        },
          {
            name: 'GDP(亿元)',
            position: 'right',
            data: ['oo','0-1','1-10','10-100','100+']
          }],
        series: [
          {
            name: '人口密度',
            data: [this.predict.predictDeath],
            yAxisIndex: 0,
            type: 'bar',
            // showBackground: true,
            // backgroundStyle: {
            //   color: 'rgba(220, 220, 220, 0.8)'
            // }
          },
          {
            name: 'GDP',
            type: 'bar',
            smooth: true,
            yAxisIndex: 1,
            data: [20]
          }
        ]
      };
      myEcharts.setOption(option)
    },

    // hyc2
    // startFindRoad(){
    //   let that=this;
    // },
    getPositionRoad(viewer, event) {
      /*
      // var position = viewer.scene.pickPosition(event.position);
      var position = (this.longTemp, this.latiTemp, this.heiTemp); //我知道了，getPosition中其实已经转换完成了，所以后面应该不需要再进行操作了
      //输出之后我们发现如前言所说的坐标都是笛卡尔坐标，所以我们需要转换笛卡尔坐标
      console.log("笛卡尔3：" + position);
      //将笛卡尔坐标转化为弧度坐标
      var cartographic = Cesium.Cartographic.fromCartesian(position);
      console.log("弧度：" + cartographic);
      //将弧度坐标转换为经纬度坐标
      var longitude = Cesium.Math.toDegrees(cartographic.longitude); //经度
      var latitude = Cesium.Math.toDegrees(cartographic.latitude); //纬度
      var height = cartographic.height; //高度
    */
      console.log("现在点击的坐标经纬度以及高度为:",this.longTemp,this.latiTemp,this.heiTemp,"以及现在num的值为",this.num)
      var longitude = this.longTemp;
      var latitude = this.latiTemp;
      var height = this.heiTemp;
      let that = this;
      if (that.num != 0) {
        that.startLon = longitude;
        that.startLat = latitude;
        that.startHei = height;
        that.num += 1;
      } else {
        alert("您还没有选取点，请点击屏幕进行选点");
        return;
      }
      // else {
      //   that.long2 = longitude;
      //   that.lati2 = latitude;
      //   that.hei2 = height;
      //   that.num = 0;
      // }
      console.log("经纬度：" + longitude, latitude, height);
      alert(
        "经度：" +
          this.startLon +
          "纬度：" +
          this.startLat +
          "高度：" +
          this.startHei
      );
      // alert(
      //   "经度：" + this.long2 + "纬度：" + this.lati2 + "高度：" + this.hei2
      // );
      console.log("num" + this.num);
      var start = {
        lng: this.startLon,
        lat: this.startLat,
        hei: this.startHei,
      };
      // var end = {
      //   longitude: this.long2,
      //   latitude: this.lati2,
      //   height: this.lati2,
      // };
      that.$axios
        .post("/calculateDistance", that.$qs.stringify(start))
        .then((res) => {
          console.log(res.data.endLon);
          that.endLat = res.data.endLat;
          that.endLon = res.data.endLon;
          var start = {
            longitude: this.startLon,
            latitude: this.startLat,
            height: this.startHei,
          };
          var end = {
            longitude: that.endLon,
            latitude: that.endLat,
            height: that.endHei,
          };
          console.log("控制台", start);
          console.log("控制台", end);
          if (this.num) that.howRes(start, end); //调用this.howRes
        });
    },
    howRes(start, end) {
      if (!start || !end) return;
      var startp = this.cartesianToLnglat(start, true);
      var endP = this.cartesianToLnglat(end, true);
      var search = this.searchRoute([startp[0], startp[1]], [endP[0], endP[1]]);
    },
    searchRoute(startP, endP) {
      console.log("1111111111111111", startP, endP);
      var startP = this.wgs2gcj(startP);
      var endP = this.wgs2gcj(endP);
      let that = this;
      this.$axios
        .get("http://restapi.amap.com/v3/direction/driving", {
          params: {
            output: "json",
            extensions: "all",
            key: "e21feddaeef263e2506376a2ddbb994e", // https://lbs.amap.com/api/webservice/guide/api/direction
            origin: startP[0] + "," + startP[1],
            destination: endP[0] + "," + endP[1],
            strategy: 11 || 10,
          },
        })
        .then((res) => {
          // that.addRouteLine(res.data.route.paths[0].steps);
          console.log("res的值为", res);
          let steps = res.data.route.paths[0].steps;
          for (var i = 0; i < steps.length; i++) {
            var item = steps[i];
            var positionStr = item.polyline;
            var strArr = positionStr.split(";");
            var arr = [];
            for (var z = 0; z < strArr.length; z++) {
              var item2 = strArr[z];
              var strArr2 = item2.split(",");
              var p = that.gcj2wgs(strArr2);
              arr.push(p);
            }
          }
          var cartesians = that.lnglatArrToCartesianArr(arr);
          var line = window.earth.entities.add({
            polyline: {
              positions: cartesians,
              clampToGround: true,
              material: Cesium.Color.RED.withAlpha(1),
              width: 3,
            },
          });
          this.moveOnRoute(line);
        });
    },
    transformWD(lng, lat) {
      var PI = 3.1415926535897932384626;
      var ret =
        -100.0 +
        2.0 * lng +
        3.0 * lat +
        0.2 * lat * lat +
        0.1 * lng * lat +
        0.2 * Math.sqrt(Math.abs(lng));
      ret +=
        ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
          2.0) /
        3.0;
      ret +=
        ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) *
          2.0) /
        3.0;
      ret +=
        ((160.0 * Math.sin((lat / 12.0) * PI) +
          320 * Math.sin((lat * PI) / 30.0)) *
          2.0) /
        3.0;
      return ret;
    },
    transformJD(lng, lat) {
      var PI = 3.1415926535897932384626;
      var ret =
        300.0 +
        lng +
        2.0 * lat +
        0.1 * lng * lng +
        0.1 * lng * lat +
        0.1 * Math.sqrt(Math.abs(lng));
      ret +=
        ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
          2.0) /
        3.0;
      ret +=
        ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) *
          2.0) /
        3.0;
      ret +=
        ((150.0 * Math.sin((lng / 12.0) * PI) +
          300.0 * Math.sin((lng / 30.0) * PI)) *
          2.0) /
        3.0;
      return ret;
    },
    wgs2gcj(arrdata) {
      var x_PI = (3.14159265358979324 * 3000.0) / 180.0;
      var PI = 3.1415926535897932384626;
      var a = 6378245.0;
      var ee = 0.00669342162296594323;
      var lng = Number(arrdata[0]);
      var lat = Number(arrdata[1]);
      var dlat = this.transformWD(lng - 105.0, lat - 35.0);
      var dlng = this.transformJD(lng - 105.0, lat - 35.0);
      var radlat = (lat / 180.0) * PI;
      var magic = Math.sin(radlat);
      magic = 1 - ee * magic * magic;
      var sqrtmagic = Math.sqrt(magic);
      dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI);
      dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI);
      var mglat = lat + dlat;
      var mglng = lng + dlng;

      mglng = Number(mglng.toFixed(6));
      mglat = Number(mglat.toFixed(6));
      return [mglng, mglat];
    },

    gcj2wgs(arrdata) {
      var x_PI = (3.14159265358979324 * 3000.0) / 180.0;
      var PI = 3.1415926535897932384626;
      var a = 6378245.0;
      var ee = 0.00669342162296594323;
      var lng = Number(arrdata[0]);
      var lat = Number(arrdata[1]);
      var dlat = this.transformWD(lng - 105.0, lat - 35.0);
      var dlng = this.transformJD(lng - 105.0, lat - 35.0);
      var radlat = (lat / 180.0) * PI;
      var magic = Math.sin(radlat);
      magic = 1 - ee * magic * magic;
      var sqrtmagic = Math.sqrt(magic);
      dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI);
      dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI);

      var mglat = lat + dlat;
      var mglng = lng + dlng;

      var jd = lng * 2 - mglng;
      var wd = lat * 2 - mglat;

      jd = Number(jd.toFixed(6));
      wd = Number(wd.toFixed(6));
      return [jd, wd];
    },
    cartesianToLnglat(cartesian, isToWgs84) {
      if (isToWgs84) {
        var lat = cartesian.latitude;
        var lng = cartesian.longitude;
        var hei = cartesian.height;
        console.log("1234555", cartesian, "9999", lat, lng, hei);
        return [lng, lat, hei];
      } else {
      }
    },
    // 经纬度转世界坐标 [101,40]
    lnglatToCartesian(lnglat) {
      if (!lnglat) return null;
      return Cesium.Cartesian3.fromDegrees(
        lnglat[0],
        lnglat[1],
        lnglat[2] || 0
      );
    },

    lnglatArrToCartesianArr(lnglatArr) {
      if (!lnglatArr) return [];
      var arr = [];
      var that = this;
      for (var i = 0; i < lnglatArr.length; i++) {
        arr.push(that.lnglatToCartesian(lnglatArr[i]));
      }
      return arr;
    },
    moveOnRoute(lineEntity) {
      console.log("已进入line2");
      var qicheModel = null;
      if (!lineEntity) return;
      var positions = lineEntity.polyline.positions.getValue();
      console.log("positions", positions);
      if (!positions) return;
      var allDis = 0;
      for (var index = 0; index < positions.length - 1; index++) {
        var dis = Cesium.Cartesian3.distance(
          positions[index],
          positions[index + 1]
        );
        allDis += dis;
      }
      var playTime = 100;
      var v = allDis / playTime;
      var startTime = window.earth.clock.currentTime;
      var endTime = Cesium.JulianDate.addSeconds(
        startTime,
        playTime,
        new Cesium.JulianDate()
      );
      var property = new Cesium.SampledPositionProperty();
      var t = 0;
      for (var i = 1; i < positions.length; i++) {
        if (i == 1) {
          property.addSample(startTime, positions[0]);
        }
        var dis = Cesium.Cartesian3.distance(positions[i], positions[i - 1]);
        var time = dis / v + t;
        var julianDate = Cesium.JulianDate.addSeconds(
          startTime,
          time,
          new Cesium.JulianDate()
        );
        property.addSample(julianDate, positions[i]);
        t += dis / v;
      }
      if (qicheModel) {
        window.viewer.entities.remove(qicheModel);
        qicheModel = null;
      }
      qicheModel = window.earth.entities.add({
        position: property,
        orientation: new Cesium.VelocityOrientationProperty(property),
        model: {
          uri: "/GroundVehicle.glb",
          scale: 5,
        },
      });
      window.earth.clock.currentTime = startTime;
      window.earth.clock.multiplier = 1;
      window.earth.clock.shouldAnimate = true;
      window.earth.clock.stopTime = endTime;
    },
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
.circle {
  border-radius: 50%;
  width: 62.5px;
  height: 62.5px;
  background: var(--color);
  /* 宽度和高度需要相等 */
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
