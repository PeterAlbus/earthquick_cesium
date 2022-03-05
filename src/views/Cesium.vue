<template>
  <DetailBox :info="detailInfo" title="详情"
             @onClickButton="selectedEarthquakeIndex=detailBox.quickEarthquakeIndex"
             @onClose="detailBox.showDetail=false"
             :showBox="detailBox.showDetail"
             :showButton="detailBox.showButton"></DetailBox>
  <el-row class="toolbar">
    <el-select v-model="imageryConfig.mapStyle" placeholder="请选择" class="toolbar-item">
      <el-option v-for="item in imageryConfig.options" :key="item.value" :label="item.label" :value="item.value"> </el-option>
    </el-select>
    <el-popover ref="controlVisible" placement="bottom" trigger="click" v-model:visible="layerControl.visible">
      <template #reference>
        <el-button type="default" icon="el-icon-menu" round class="toolbar-item">图层控制</el-button>
      </template>
      <el-checkbox v-model="layerControl.showIntensity" label="烈度图"></el-checkbox><br/>
      <el-checkbox v-model="layerControl.showEpicenter" label="震源"></el-checkbox>
      <el-checkbox v-model="layerControl.showHospital" label="显示医院"></el-checkbox>
      <el-checkbox v-model="layerControl.showFireCenter" label="显示救援物资分配"></el-checkbox>
    </el-popover>
    <el-button type="primary" round
               v-on:click="cameraTo(earthquakeInfoList[selectedEarthquakeIndex].longitude,earthquakeInfoList[selectedEarthquakeIndex].latitude,100000)"
               icon="el-icon-s-flag"
               class="toolbar-item">跳转到所选震区</el-button>
    <EarthquakeSelect
        :earthquakeInfoList="earthquakeInfoList"
        :selectedEarthquakeIndex="selectedEarthquakeIndex"
        @changeSelect="selectEarthquakeIndex"
        @updateList="getEarthquakeList"
        @newList="updateEarthquakeList"
    ></EarthquakeSelect>
    <EstimateEarthquake :earthquake="earthquakeInfoList[selectedEarthquakeIndex]"></EstimateEarthquake>
    <AddEarthquake></AddEarthquake>
    <!-- hyc2 -->
    <el-button
        type="primary"
        round
        @click="getPositionRoad"
        class="toolbar-item"
    >开始路径规划</el-button>
  </el-row>
  <el-row ref="viewerContainer" class="viewer">
    <vc-viewer
        ref="vcViewer"
        :animation="viewerConfig.animation"
        :baseLayerPicker="viewerConfig.baseLayerPicker"
        :timeline="viewerConfig.timeline"
        :fullscreenButton="viewerConfig.fullscreenButton"
        :fullscreenElement="viewerConfig.fullscreenElement"
        :infoBox="viewerConfig.infoBox"
        :selectionIndicator="false"
        :showCredit="viewerConfig.showCredit"
        @ready="onViewerReady"
    >
      <vc-selection-indicator ref="selectionIndicator" @pickEvt="pickEvt"></vc-selection-indicator>
      <vc-measurements
          @draw-evt="drawEvt"
          @active-evt="activeEvt"
          @editor-evt="editorEvt"
          @mouse-evt="mouseEvt"
          ref="measurementsRef"
          position="bottom-left"
          :mainFabOpts="measurementFabOptions"
          :offset="[20, 80]"
      >
      </vc-measurements>
      <vc-datasource-custom name="epicenter" :show="layerControl.showEpicenter">
        <vc-entity
            :position="[item.longitude,item.latitude, 0]"
            description="epicenter"
            :id="'epicenter_'+index.toString()"
            v-for="(item,index) in earthquakeInfoList"
        >
          <vc-graphics-point ref="point1" color="red" :pixelSize="2*item.magnitude"></vc-graphics-point>
        </vc-entity>
      </vc-datasource-custom>
      <vc-datasource-custom name="intensity" :show="layerControl.showIntensity">
        <vc-entity
            :position="[earthquakeInfoList[selectedEarthquakeIndex].longitude,earthquakeInfoList[selectedEarthquakeIndex].latitude, 0]"
            :description="'震源位置:'+earthquakeInfoList[selectedEarthquakeIndex].latitude+','+earthquakeInfoList[selectedEarthquakeIndex].longitude+',震级:'+earthquakeInfoList[selectedEarthquakeIndex].magnitude"
            id="earthquake"
        >
          <vc-graphics-point ref="point1" color="red" :pixelSize="2*earthquakeInfoList[selectedEarthquakeIndex].magnitude"></vc-graphics-point>
        </vc-entity>
        <vc-entity
            :position="[earthquakeInfoList[selectedEarthquakeIndex].longitude,earthquakeInfoList[selectedEarthquakeIndex].latitude,0]"
            :description="'最外圈烈度:'+item.intensity"
            :id="'intensity'+item.intensity+'('+item.longRadius+','+item.shortRadius+')'"
            v-for="item in earthquakeInfoList[selectedEarthquakeIndex].intensityLineList"
        >
          <vc-graphics-ellipse
              :semiMinorAxis="item.longRadius*1000"
              :semiMajorAxis="item.shortRadius*1000"
              :material="[255, (10-item.intensity)*30, 0, 125]"
              :rotation="item.rotation"
              :fill="true">
          </vc-graphics-ellipse>
        </vc-entity>
      </vc-datasource-custom>
<!--      <vc-terrain-provider-tianditu token="fd7029d3dff756b437af91d68aadc6bf"></vc-terrain-provider-tianditu>-->
      <vc-layer-imagery :alpha="imageryConfig.alpha" :brightness="imageryConfig.brightness" :contrast="imageryConfig.contrast" :sortOrder="20">
        <vc-imagery-provider-tianditu mapStyle="cva_w" token="fd7029d3dff756b437af91d68aadc6bf"></vc-imagery-provider-tianditu>
      </vc-layer-imagery>
      <vc-layer-imagery :alpha="imageryConfig.alpha" :brightness="imageryConfig.brightness" :contrast="imageryConfig.contrast" :sortOrder="10">
        <vc-imagery-provider-tianditu :mapStyle="imageryConfig.mapStyle" token="fd7029d3dff756b437af91d68aadc6bf" ref="provider"></vc-imagery-provider-tianditu>
      </vc-layer-imagery>
      <vc-navigation :offset="navigationConfig.offset" :otherOpts="navigationConfig.otherOpts"></vc-navigation>
      <vc-ajax-bar></vc-ajax-bar>
      <!-- hyc：增加图标位置 -->
      <vc-collection-primitive
        :show="layerControl.showHospital"
      >
        <vc-collection-billboard
          :billboards="hospitalBillboards"
        ></vc-collection-billboard>
      </vc-collection-primitive>
      <!--        hyc：增加椭圆显示位置-->
      <vc-entity :position="[longTemp, latiTemp]" description="您所点击的位置所表示的区域">
        <vc-graphics-ellipse :semiMinorAxis="50.0" :semiMajorAxis="50.0" :material="[255, 0, 0, 125]"></vc-graphics-ellipse>
      </vc-entity>
      <!--hyc:消防队位置-->
      <vc-collection-primitive
          :show="layerControl.showFireCenter"
      >
        <vc-collection-billboard
            :billboards="fireCenterBillboards"
        ></vc-collection-billboard>
        <vc-collection-label :labels="fireWeight" @mouseout="onMouseout" @mouseover="onMouseover">
        </vc-collection-label>
      </vc-collection-primitive>
    </vc-viewer>
  </el-row>
</template>

<script>
import {reactive, ref } from "vue";
import DetailBox from "../components/DetailBox";
import EarthquakeSelect from "../components/EarthquakeSelect";
import AddEarthquake from "../components/AddEarthquake";
import EstimateEarthquake from "../components/EstimateEarthquake";
export default {
  name: "Cesium",
  components: {
    DetailBox,
    EarthquakeSelect,
    AddEarthquake,
    EstimateEarthquake
  },
  data() {
    return {
      //data
      fireWeight:[],
      hospitalBillboards:[],
      fireCenterBillboards:[],
      hospitalList: [],
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
      selectedEarthquakeIndex:0,
      //detailBox
      detailBox:{
        showDetail: false,
        detailClass: 0,
        detailIndex: 0,
        quickEarthquakeIndex:0,
        showButton: true
      },
      //measure
      measurementFabOptions: {
        direction: 'right'
      },
      //viewer
      viewerConfig:{
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        infoBox: false,
        showCredit: false,
        fullscreenElement: document.body,
      },
      //imagery-provider
      imageryConfig:{
        alpha:1,
        brightness:1,
        contrast:1,
        mapStyle:'img_w',
        options: [
          {value: 'img_c', label: '全球影像地图服务(经纬度)'},
          {value: 'img_w', label: '全球影像地图服务(墨卡托)'},
          {value: 'vec_c', label: '全球矢量地图服务(经纬度)'},
          {value: 'vec_w', label: '全球矢量地图服务(墨卡托)'},
          {value: 'ter_c', label: '全球地形晕渲服务(经纬度)'},
          {value: 'ter_w', label: '全球地形晕渲服务(墨卡托)'},
          {value: 'ibo_c', label: '全球境界(经纬度)'},
          {value: 'ibo_w', label: '全球境界(墨卡托)'}
        ],
      },
      //navigation
      navigationConfig:{
        offset: [10, 25],
        otherOpts: {
          offset: [0, 32],
          position: 'bottom-right'
        },
      },
      //layerControl
      layerControl:{
        visible:false,
        showIntensity: true,
        showEpicenter: true,
        showHospital: false,
        showFireCenter: false,
      },
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
      this.navigationConfig.otherOpts.offset = val ? [0, 30] : this.fullscreenButton ? [30, 5] : [0, 5]
    },
    fullscreenButton(val) {
      if (!this.timeline && !val) {
        this.navigationConfig.otherOpts.offset = [0, 5]
      } else if (!this.timeline && val) {
        this.navigationConfig.otherOpts.offset = [30, 5]
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
    });
  },
  methods: {
    //update earthquake list
    updateEarthquakeList(list){
      this.earthquakeInfoList=list
    },
    //get earthquake list
    getEarthquakeList(){
      let that=this;
      that.$axios.get("earthquakeInfo/getAllEarthquake")
          .then(res=>{
            console.log('earthquakeInfoList',res)
            that.earthquakeInfoList=res.data;
            that.selectedEarthquakeIndex=0;
          })
    },
    //change selected earthquake by index
    selectEarthquakeIndex(index){
      this.selectedEarthquakeIndex=index;
    },
    //change location
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
    //event when mouse pick an entity or a position
    pickEvt(e){
      this.layerControl.visible=false
      try{
        if(e._id==='__Vc__Pick__Location__')
        {
          // console.log('pickEvt',e)
          let cartographic = Cesium.Cartographic.fromCartesian(e._position._value);
          this.longTemp = Cesium.Math.toDegrees(cartographic.longitude);
          this.latiTemp = Cesium.Math.toDegrees(cartographic.latitude);
          this.heiTemp = cartographic.height;
          this.num++
          console.log('经纬度',this.longTemp,this.latiTemp,this.heiTemp)
        }
        let kind=e.id.split("_")[0]
        let index=0
        if(kind==='epicenter')
        {
          index=parseInt(e.id.split("_")[1])
          this.detailBox.showDetail=true
          this.detailBox.detailClass=1
          this.detailBox.detailIndex=index
          this.detailBox.quickEarthquakeIndex=index
        }
        else if(kind==='hospital')
        {
          index=parseInt(e.id.split("_")[1])
          this.detailBox.showDetail=true
          this.detailBox.detailClass=2
          this.detailBox.detailIndex=index
          this.detailBox.quickEarthquakeIndex=index
        }
        else
        {
          this.detailBox.showDetail=false
        }
      }
      catch (err) {
        this.detailBox.showDetail=false
      }
    },
    onViewerReady({ Cesium, viewer }) {
      // hyc
      let that = this;
      this.$axios.get("/findAllHospital").then((res) => {
        console.log(res.data.length);
        this.hospitalList=res.data
        for (let i = 0; i < res.data.length; i++) {
          let hospitalBillboard = {};
          hospitalBillboard.position = {
            lng: res.data[i].lon,
            lat: res.data[i].lat,
          };
          hospitalBillboard.id='hospital_'+i
          hospitalBillboard.image = "https://file.peteralbus.com/assets/cesium/img/Hospital.png";
          hospitalBillboard.scale = 0.1;
          that.hospitalBillboards.push(hospitalBillboard);
        }
      });
      this.$axios.get("/calculateWeight").then((res)=>{
        let sum=0;
        for(let i=0; i<res.data.length; i++){
          let billboard={};
          billboard.position={
            lng:res.data[i].fireLon,
            lat:res.data[i].fireLat,
          }
          billboard.image="https://file.peteralbus.com/assets/cesium/img/fireCenter.png";
          billboard.scale = 0.1;
          billboard.weight=1/(1-res.data[i].fireCenterWeight);
          sum+=billboard.weight;
          that.fireCenterBillboards.push(billboard);
        }
        for(let i=0;i<that.fireCenterBillboards.length;i++){
          let fireWeight1={};
          fireWeight1.position=that.fireCenterBillboards[i].position;
          fireWeight1.text="所要分配的物资数量为:"+Math.floor((that.fireCenterBillboards[i].weight/sum)*1000).toString()+"个";
          that.fireWeight.push(fireWeight1);
        }
      })
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
          let viewer=this.$refs.vcViewer.getCesiumObject();
          var line = viewer.entities.add({
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
      let viewer=this.$refs.vcViewer.getCesiumObject();
      var startTime = viewer.clock.currentTime;
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
      qicheModel = viewer.entities.add({
        position: property,
        orientation: new Cesium.VelocityOrientationProperty(property),
        model: {
          uri: "https://file.peteralbus.com/assets/cesium/glb/GroundVehicle.glb",
          scale: 5,
        },
      });
      viewer.clock.currentTime = startTime;
      viewer.clock.multiplier = 1;
      viewer.clock.shouldAnimate = true;
      viewer.clock.stopTime = endTime;
    },
    onMouseover(e){
      if (e.cesiumObject instanceof Cesium.Label) {
        this.scale = 1.5 // or e.cesiumObject.scale = 1.5
        e.pickedFeature.primitive.scale = 1.5
      } else if (e.cesiumObject instanceof Cesium.LabelCollection) {
        e.pickedFeature.primitive.scale = 1.5
      }
    },

    onMouseout(e){
      if (e.cesiumObject instanceof Cesium.Label) {
        this.scale = 1 // or e.cesiumObject.scale = 1
      } else if (e.cesiumObject instanceof Cesium.LabelCollection) {
        e.pickedFeature.primitive.scale = 1
      }
    },

    //量算工具
    drawEvt(e, viewer) {
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

    //坐标转换
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
  },
  computed:{
    detailInfo: function (){
      let info=[]
      if(this.detailBox.detailClass===1)
      {
        info=[
          {
            key:'地震名称',
            value: this.earthquakeInfoList[this.detailBox.detailIndex].earthquakeName,
          },
          {
            key:'震级',
            value: this.earthquakeInfoList[this.detailBox.detailIndex].magnitude,
          },
          {
            key:'震源经纬度',
            value: this.earthquakeInfoList[this.detailBox.detailIndex].longitude+','+this.earthquakeInfoList[this.detailBox.detailIndex].latitude,
          },
          {
            key:'震中烈度',
            value: this.earthquakeInfoList[this.detailBox.detailIndex].highIntensity,
          },
          {
            key:'发生时间',
            value: this.earthquakeInfoList[this.detailBox.detailIndex].earthquakeTime,
          },]
      }
      else if(this.detailBox.detailClass===2)
      {
        info=[
          {
            key:'医院名称',
            value: this.hospitalList[this.detailBox.detailIndex].name,
          },
          {
            key:'地址',
            value: this.hospitalList[this.detailBox.detailIndex].address,
          },
          {
            key:'经纬度',
            value: this.hospitalList[this.detailBox.detailIndex].lon+','+this.hospitalList[this.detailBox.detailIndex].lat,
          },
          {
            key:'所在省市',
            value: this.hospitalList[this.detailBox.detailIndex].pname+this.hospitalList[this.detailBox.detailIndex].cityname,
          },
          {
            key:'类型',
            value: this.hospitalList[this.detailBox.detailIndex].type,
          },]
      }
      return info
    }
  }
}
</script>

<style scoped>
.toolbar {
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

.viewer{

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
</style>
