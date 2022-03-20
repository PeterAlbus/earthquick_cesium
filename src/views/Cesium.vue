<template>
  <DetailBox :info="detailInfo" title="详情"
             @onClickButton="selectEarthquakeIndex(detailBox.quickEarthquakeIndex)"
             @onClose="detailBox.showDetail=false"
             :showBox="detailBox.showDetail"
             :showButton="detailBox.showButton"></DetailBox>
  <el-row class="toolbar">
    <el-select v-model="imageryConfig.mapStyle" placeholder="请选择" class="toolbar-item">
      <el-option v-for="item in imageryConfig.options" :key="item.value" :label="item.label" :value="item.value"> </el-option>
    </el-select>
    <el-popover ref="controlVisible" placement="bottom" trigger="click" v-model:visible="layerControl.visible" width="170px">
      <template #reference>
        <el-button type="default" icon="el-icon-menu" round class="toolbar-item">图层控制</el-button>
      </template>
      <el-checkbox v-model="layerControl.showIntensity" label="烈度图"></el-checkbox><br/>
      <el-checkbox v-model="layerControl.showEpicenter" label="震源"></el-checkbox>
      <el-checkbox v-model="layerControl.showHospital" label="显示医院"></el-checkbox>
      <el-tooltip placement="right" effect="light">
        <template #content>
          默认的物资总量为1000个
        </template>
        <el-checkbox v-model="layerControl.showFireCenter" label="显示救援物资分配"></el-checkbox>
      </el-tooltip>
      <el-collapse v-model="activeCalculateWeight" @change="handleChangeWeight" v-loading="fireCenterLoading" element-loading-text="正在进行物资分配计算">
        <el-collapse-item title="展开" name="1">
          设置物资分配总量:
          <el-input-number v-model="DistributionSum" :step="100" size="small" style="margin-top: 10px;"/>
          设置物资分配地区数量:
          <el-input-number v-model="DistrictSum" :step="5" size="small" style="margin-top: 10px;" :min="5" :max="30"/>
          <el-button type="primary" icon="el-icon-success" size="small" @click="reGetCalculateWeight" style="margin-top: 10px;margin-left: 60px">计算</el-button>
        </el-collapse-item>
      </el-collapse>
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
        @jumpTo="cameraTo"
    ></EarthquakeSelect>
    <EstimateEarthquake :earthquake="earthquakeInfoList[selectedEarthquakeIndex]"></EstimateEarthquake>
    <AddEarthquake></AddEarthquake>
    <!-- hyc2 -->
<!--    <el-button-->
<!--        type="primary"-->
<!--        round-->
<!--        @click="getPositionRoad"-->
<!--        class="toolbar-item"-->
<!--    >开始路径规划</el-button>-->
    <el-popover
        v-model:visible="visibleRoad"
        placement="bottom"
        :width="420"
    >
      <template #reference>
        <el-button @click="visibleRoad = !visibleRoad" class="toolbar-item" round>
          救援路径规划
        </el-button>
      </template>
      <div>
        <el-radio v-model="radioRoad" label="1" size="small" border>驾车</el-radio>
        <el-radio v-model="radioRoad" label="2" size="small" border>步行</el-radio>
        <el-radio v-model="radioRoad" label="3" size="small" border>电动车</el-radio>
      </div>
      <div style="margin-top: 20px">
        <el-button type="primary" icon="el-icon-magic-stick" size="small" @click="selectPositionRoad">选取救援点</el-button>
        <el-button type="primary" icon="el-icon-search" size="small" @click="getPositionRoad">开始路径规划</el-button>
        <el-button type="danger" icon="el-icon-s-release" size="small" @click="stopPositionRoad">关闭</el-button>
      </div>
    </el-popover>

  </el-row>
  <el-row ref="viewerContainer" class="viewer" v-loading="cesiumLoading" element-loading-text="初次加载可能稍慢，请耐心等待">
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
            :position="[earthquakeInfoList[selectedEarthquakeIndex].longitude,earthquakeInfoList[selectedEarthquakeIndex].latitude,0]"
            :description="'最外圈烈度:'+item.intensity"
            :id="'intensity_'+index"
            v-for="(item,index) in earthquakeInfoList[selectedEarthquakeIndex].intensityLineList"
        >
          <vc-graphics-ellipse
              :semiMinorAxis="item.longRadius*1000"
              :semiMajorAxis="item.shortRadius*1000"
              :material="[255, (10-item.intensity)*30, 0, 125]"
              :rotation="item.angle"
              :fill="true">
          </vc-graphics-ellipse>
        </vc-entity>
      </vc-datasource-custom>
<!--      <vc-terrain-provider-tianditu token="fd7029d3dff756b437af91d68aadc6bf"></vc-terrain-provider-tianditu>-->
      <vc-layer-imagery :alpha="imageryConfig.alpha" :brightness="imageryConfig.brightness" :contrast="imageryConfig.contrast" :sortOrder="20">
        <vc-imagery-provider-tianditu mapStyle="cva_w" token="de232c2bf878c7a7928afde78e339913"></vc-imagery-provider-tianditu>
      </vc-layer-imagery>
      <vc-layer-imagery :alpha="imageryConfig.alpha" :brightness="imageryConfig.brightness" :contrast="imageryConfig.contrast" :sortOrder="10">
        <vc-imagery-provider-tianditu :mapStyle="imageryConfig.mapStyle" token="de232c2bf878c7a7928afde78e339913" ref="provider"></vc-imagery-provider-tianditu>
      </vc-layer-imagery>
      <vc-navigation :offset="navigationConfig.offset" :otherOpts="navigationConfig.otherOpts"></vc-navigation>
      <vc-ajax-bar></vc-ajax-bar>
      <!-- hyc：增加图标位置 -->
<!--      <vc-collection-primitive-->
<!--        :show="layerControl.showHospital"-->
<!--      >-->
<!--        <vc-collection-billboard-->
<!--          :billboards="hospitalBillboards"-->
<!--        ></vc-collection-billboard>-->
<!--      </vc-collection-primitive>-->
      <vc-datasource-custom
          :show="layerControl.showHospital"
          name="hospitalList"
          :entities="hospitalBillboards"
          @clusterEvent="onHospitalClusterEvent"
          @ready="onHospitalReady"
      >
      </vc-datasource-custom>
      <!--        hyc：增加椭圆显示位置-->
      <vc-entity :position="[longTemp, latiTemp]" description="您所点击的位置所表示的区域">
        <vc-graphics-ellipse :semiMinorAxis="50.0" :semiMajorAxis="50.0" :material="[255, 0, 0, 125]"></vc-graphics-ellipse>
        <vc-graphics-label text="起点" font="20px sans-serif" :pixelOffset="[0, 20]" fillColor="red"></vc-graphics-label>
      </vc-entity>
      <!--hyc:消防队位置-->
      <vc-datasource-custom
          :show="layerControl.showFireCenter"
          name="fireCenterList"
          :entities="fireCenterBillboards"
          @clusterEvent="onFireCenterClusterEvent"
          @ready="onFireCenterReady"
          @mouseout="onMouseout"
          @mouseover="onMouseover"
      >
      </vc-datasource-custom>
    </vc-viewer>
  </el-row>
</template>

<script>
import DetailBox from "../components/DetailBox";
import EarthquakeSelect from "../components/EarthquakeSelect";
import AddEarthquake from "../components/AddEarthquake";
import EstimateEarthquake from "../components/EstimateEarthquake";
import {cartesianToLnglat, gcj2wgs, lnglatArrToCartesianArr, wgs2gcj} from "../assets/coordinateConversion";
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
      DistrictSum:10,
      activeCalculateWeight:['1'],
      DistributionSum:1000,
      cesiumLoading:true,
      fireCenterLoading:false,
      visibleRoad:false,
      radioRoad:"1",
      Search:this.Search,
      Check:this.Check,
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
          lineId:1,
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
      viewer.scene.globe.depthTestAgainstTerrain = false;
    });
  },
  methods: {
    handleChangeWeight(val) {
      console.log(val);
    },
    reGetCalculateWeight(){
      this.$message.warning("请耐心等待，后台正在重新进行物资分配~")
      this.fireWeight=[];
      this.fireCenterBillboards=[];
      this.getFireCenters();
    },
    //update earthquake list
    updateEarthquakeList(list){
      this.earthquakeInfoList=list
      this.getHospitals();
      this.getFireCenters();
    },
    //get earthquake list
    getEarthquakeList(){
      let that=this;
      that.$axios.get("earthquakeInfo/getAllEarthquake")
          .then(res=>{
            that.earthquakeInfoList=res.data;
            that.selectedEarthquakeIndex=0;
            that.getHospitals();
            that.getFireCenters();
          })
    },
    //change selected earthquake by index
    selectEarthquakeIndex(index){
      this.selectedEarthquakeIndex=index;
      this.getHospitals();
      this.getFireCenters();
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
        // console.log('pickEvt',e)
        if(e._id==='__Vc__Pick__Location__')
        {
          if(this.num!==0)
          {
            let cartographic = Cesium.Cartographic.fromCartesian(e._position._value);
            this.longTemp = Cesium.Math.toDegrees(cartographic.longitude);
            this.latiTemp = Cesium.Math.toDegrees(cartographic.latitude);
            this.heiTemp = cartographic.height;
            console.log('经纬度',this.longTemp,this.latiTemp,this.heiTemp)
            this.num=0;
          }
          else
          {
            this.visibleRoad = false;
          }
        }
        let kind=e.id.split("_")[0]
        let index=0
        if(kind==='epicenter')
        {
          index=parseInt(e.id.split("_")[1])
          this.detailBox.showButton=true
          this.detailBox.showDetail=true
          this.detailBox.detailClass=1
          this.detailBox.detailIndex=index
          this.detailBox.quickEarthquakeIndex=index
        }
        else if(kind==='hospital')
        {
          index=parseInt(e.id.split("_")[1])
          this.detailBox.showButton=false
          this.detailBox.showDetail=true
          this.detailBox.detailClass=2
          this.detailBox.detailIndex=index
          this.detailBox.quickEarthquakeIndex=index
        }
        else if(kind==='fireCenter')
        {
          index=parseInt(e.id.split("_")[1])
          this.detailBox.showButton=false
          this.detailBox.showDetail=true
          this.detailBox.detailClass=3
          this.detailBox.detailIndex=index
        }
        else if(kind==='intensity')
        {
          index=parseInt(e.id.split("_")[1])
          this.detailBox.showButton=false
          this.detailBox.showDetail=true
          this.detailBox.detailClass=4
          this.detailBox.detailIndex=index
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
      this.cesiumLoading=false;
    },
    getHospitals(){
      // hyc
      let that = this;
      that.hospitalBillboards=[];
      this.$axios.get("/findHospitalNearby?earthquakeId="+that.earthquakeInfoList[that.selectedEarthquakeIndex].earthquakeId).then((res) => {
        this.hospitalList = res.data
        for (let i = 0; i < res.data.length; i++) {
          let hospitalBillboard = {};
          hospitalBillboard.position = {
            lng: res.data[i].lon,
            lat: res.data[i].lat,
          };
          hospitalBillboard.billboard = {
            id: 'hospital_' + i,
            image: "https://file.peteralbus.com/assets/cesium/img/Hospital.png",
            scale: 0.1
          }
          hospitalBillboard.id='hospital_' + i
          that.hospitalBillboards.push(hospitalBillboard);
        }
      });
    },
    getFireCenters(){
      // hyc
      this.fireWeight=[];
      this.fireCenterBillboards=[];
      let that = this;
      this.fireCenterLoading=true;
      this.$axios.get("/findFireCenterNearby?earthquakeId="+that.earthquakeInfoList[that.selectedEarthquakeIndex].earthquakeId).then((res) => {
        let sum=0;
        for(let i=0; i<res.data.length; i++){
          if(i>=that.DistrictSum){
            break;
          }
          let billboard={};
          billboard.position={
            lng:res.data[i].fireLon,
            lat:res.data[i].fireLat,
          }
          billboard.billboard={
            image: "https://file.peteralbus.com/assets/cesium/img/fireCenter.png",
            scale: 0.1,
            weight: 1/(1-res.data[i].fireCenterWeight),
            pixelOffset:{x: 0, y: -45}
          }
          billboard.id=
          sum+=billboard.billboard.weight;
          that.fireCenterBillboards.push(billboard);
        }
        for(let i=0;i<that.fireCenterBillboards.length;i++){
          let fireWeight1={};
          fireWeight1.position=that.fireCenterBillboards[i].position;
          that.fireCenterBillboards[i].label={
            text:"所要分配的物资数量为:"+Math.floor((that.fireCenterBillboards[i].billboard.weight/sum)*this.DistributionSum).toString()+"个"
          }
          that.fireCenterBillboards[i].id="fireCenter_"+Math.floor((that.fireCenterBillboards[i].billboard.weight/sum)*this.DistributionSum).toString()+"_"+i;
            // fireWeight1.text="所要分配的物资数量为:"+Math.floor((that.fireCenterBillboards[i].billboard.weight/sum)*this.DistributionSum).toString()+"个";
            // that.fireWeight.push(fireWeight1);
        }
        that.fireCenterLoading=false
        that.layerControl.visible=false
        that.$message.success('物资分配计算完成')
      })
      .catch(()=>{
        that.fireCenterLoading=false
        that.$message.error('物资分配计算失败')
      });
    },
    stopPositionRoad(){
      this.num=0;
      this.longTemp=0.0;
      this.latiTemp=0.0;
      this.$message.error("结束路径规划,如想要开启路径规划功能，请重新选点");
      this.visibleRoad=!this.visibleRoad;
    },
    selectPositionRoad(){
      this.num++;
      this.$message.success("现在可以开始选取救援点啦~");
    },
    getPositionRoad(viewer, event) {
      console.log("现在点击的坐标经纬度以及高度为:",this.longTemp,this.latiTemp,this.heiTemp,"以及现在num的值为",this.num)
      console.log("我们现在点击的坐标",this.radioRoad)
      let longitude = this.longTemp;
      let latitude = this.latiTemp;
      let height = this.heiTemp;
      let that = this;
      if (that.num !== 0) {
        that.startLon = longitude;
        that.startLat = latitude;
        that.startHei = height;
        that.num += 1;
      }
      else {
        that.$message.error("您还没有选取点，请点击屏幕进行选点");
        return;
      }
      that.$message.success("开始路径规划！");
      //起点：经度："+this.startLon +"纬度："+this.startLat+"高度："+this.startHei
      let start = {
        lng: this.startLon,
        lat: this.startLat,
        hei: this.startHei,
      };
      that.$axios
        .post("/calculateDistance", that.$qs.stringify(start))
        .then((res) => {
          that.endLat = res.data.endLat;
          that.endLon = res.data.endLon;
          let start = {
            longitude: this.startLon,
            latitude: this.startLat,
            height: this.startHei,
          };
          let end = {
            longitude: that.endLon,
            latitude: that.endLat,
            height: that.endHei,
          };
          if (this.num) that.howRes(start, end); //调用this.howRes
        });
    },
    howRes(start, end) {
      if (!start || !end) return;
      let startP = cartesianToLnglat(start, true);
      let endP = cartesianToLnglat(end, true);
      this.searchRoute([startP[0], startP[1]], [endP[0], endP[1]]);
    },
    searchRoute(startP, endP) {
      startP = wgs2gcj(startP);
      endP = wgs2gcj(endP);
      let that = this;
      let travelWay;
      if(this.radioRoad=="1"){
        travelWay="/v3/direction/driving";
      }
      if(this.radioRoad=="2"){
        travelWay="/v3/direction/walking"
      }
      if(this.radioRoad=="3"){
        travelWay="/v4/direction/bicycling"
      }
      this.$axios
          .get("https://restapi.amap.com"+travelWay, {
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
            console.log("路径规划结果：", res.data);
            let steps;
            if(this.radioRoad==3)
              steps = res.data.data.paths[0].steps;
            else if(this.radioRoad==1 ||this.radioRoad==2)
              steps = res.data.route.paths[0].steps;
            let arr = [];
            for (let i = 0; i < steps.length; i++) {
              let item = steps[i];
              let positionStr = item.polyline;
              let strArr = positionStr.split(";");
              for (let z = 0; z < strArr.length; z++) {
                let item2 = strArr[z];
                let strArr2 = item2.split(",");
                let p = gcj2wgs(strArr2);
                arr.push(p);
              }
            }
            let cartesianArr = lnglatArrToCartesianArr(arr);
            let viewer=this.$refs.vcViewer.getCesiumObject();
            let colorTraffic;
            if(this.radioRoad==1){
              colorTraffic=Cesium.Color.RED.withAlpha(0.9);
            }
            else if(this.radioRoad==2){
              colorTraffic=Cesium.Color.BLUE.withAlpha(1);
            }
            else{
              colorTraffic=Cesium.Color.YELLOW.withAlpha(1);
            }
            let line = viewer.entities.add({
              polyline: {
                positions: cartesianArr,
                clampToGround: true,
                material: colorTraffic,
                width: 5,
              },
            });
            this.moveOnRoute(line);
          });
    },
    moveOnRoute(lineEntity) {
      let viewer=this.$refs.vcViewer.getCesiumObject();
      let carModel = null;
      if (!lineEntity) return;
      let positions = lineEntity.polyline.positions.getValue();
      if (!positions) return;
      let allDis = 0;
      for (let index = 0; index < positions.length - 1; index++) {
        let distance = Cesium.Cartesian3.distance(positions[index],positions[index + 1]);
        allDis += distance;
      }
      let playTime = 100;
      let v = allDis / playTime;
      let startTime = viewer.clock.currentTime;
      let endTime = Cesium.JulianDate.addSeconds(startTime,playTime,new Cesium.JulianDate());
      let property = new Cesium.SampledPositionProperty();
      let t = 0;
      for (let i = 1; i < positions.length; i++) {
        if (i === 1) {
          property.addSample(startTime, positions[0]);
        }
        let dis = Cesium.Cartesian3.distance(positions[i], positions[i - 1]);
        let time = dis / v + t;
        let julianDate = Cesium.JulianDate.addSeconds(
            startTime,
            time,
            new Cesium.JulianDate()
        );
        property.addSample(julianDate, positions[i]);
        t += dis / v;
      }
      // if (carModel) {
      //   viewer.entities.remove(carModel);
      //   carModel = null;
      // }
      let modelUrl;
      let modelSize;
      if(this.radioRoad==1){
        modelSize=5;
        modelUrl="https://file.peteralbus.com/assets/cesium/glb/GroundVehicle.glb";
      }
      else if(this.radioRoad==2){
        modelSize=250;
        modelUrl="https://file.peteralbus.com/assets/cesium/glb/Astronaut.glb";
      }
      else if(this.radioRoad==3){
        modelSize=50;
        modelUrl="https://file.peteralbus.com/assets/cesium/glb/Motorcycle.glb"
      }
      carModel = viewer.entities.add({
        position: property,
        orientation: new Cesium.VelocityOrientationProperty(property),
        model: {
          uri: modelUrl,
          scale: modelSize,
        },
      });
      viewer.clock.currentTime = startTime;
      viewer.clock.multiplier = 1;
      viewer.clock.shouldAnimate = true;
      viewer.clock.stopTime = endTime;
    },

    onHospitalReady ({ Cesium, viewer, cesiumObject }) {
      window.cesiumObject = cesiumObject

      //开启聚合功能
      cesiumObject.clustering.enabled = true
      cesiumObject.clustering.pixelRange = 30
      cesiumObject.clustering.minimumClusterSize = 3
    },
    onHospitalClusterEvent(clusteredEntities, cluster){
      cluster.billboard.show = !0
      cluster.label.show = !1
      cluster.billboard.id = cluster.label.id
      cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.CENTER
      clusteredEntities.length >= 300
          ? (cluster.billboard.image = 'https://file.peteralbus.com/assets/cesium/img/clusters/300+.png')
          : clusteredEntities.length >= 150
              ? (cluster.billboard.image = 'https://file.peteralbus.com/assets/cesium/img/clusters/150+.png')
              : clusteredEntities.length >= 90
                  ? (cluster.billboard.image = 'https://file.peteralbus.com/assets/cesium/img/clusters/90+.png')
                  : clusteredEntities.length >= 30
                      ? (cluster.billboard.image = 'https://file.peteralbus.com/assets/cesium/img/clusters/30+.png')
                      : clusteredEntities.length > 10
                          ? (cluster.billboard.image = 'https://file.peteralbus.com/assets/cesium/img/clusters/10+.png')
                          : (cluster.billboard.image = 'https://file.peteralbus.com/assets/cesium/img/clusters/' + clusteredEntities.length + '.png')
    },
    onFireCenterReady ({ Cesium, viewer, cesiumObject }) {
      window.cesiumObject = cesiumObject

      //开启聚合功能
      cesiumObject.clustering.enabled = true
      cesiumObject.clustering.pixelRange = 30
      cesiumObject.clustering.minimumClusterSize = 2
    },
    onFireCenterClusterEvent(clusteredEntities, cluster){
      cluster.billboard.show = !0
      cluster.label.show = !1
      cluster.billboard.id = cluster.label.id
      cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.CENTER
      clusteredEntities.length >= 300
          ? (cluster.billboard.image = 'https://file.peteralbus.com/assets/cesium/img/clusters/300+.png')
          : clusteredEntities.length >= 150
              ? (cluster.billboard.image = 'https://file.peteralbus.com/assets/cesium/img/clusters/150+.png')
              : clusteredEntities.length >= 90
                  ? (cluster.billboard.image = 'https://file.peteralbus.com/assets/cesium/img/clusters/90+.png')
                  : clusteredEntities.length >= 30
                      ? (cluster.billboard.image = 'https://file.peteralbus.com/assets/cesium/img/clusters/30+.png')
                      : clusteredEntities.length > 10
                          ? (cluster.billboard.image = 'https://file.peteralbus.com/assets/cesium/img/clusters/10+.png')
                          : (cluster.billboard.image = 'https://file.peteralbus.com/assets/cesium/img/clusters/' + clusteredEntities.length + '.png')
    },
    //物资分配特效
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
      else if(this.detailBox.detailClass===3)
      {
        info=[
          {
            key:'物资数量',
            value:this.detailBox.detailIndex,
          }]
      }
      else if(this.detailBox.detailClass===4)
      {
        info=[
          {
            key:'烈度',
            value:this.earthquakeInfoList[this.selectedEarthquakeIndex].intensityLineList[this.detailBox.detailIndex].intensity+'(选中区域外圈等烈度线)',
          },
          {
            key:'长轴半径',
            value:this.earthquakeInfoList[this.selectedEarthquakeIndex].intensityLineList[this.detailBox.detailIndex].longRadius+'km',
          },
          {
            key:'短轴半径',
            value:this.earthquakeInfoList[this.selectedEarthquakeIndex].intensityLineList[this.detailBox.detailIndex].shortRadius+'km',
          }
        ]
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
