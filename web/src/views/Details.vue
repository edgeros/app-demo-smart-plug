<template>
  <div class="about">
    <van-nav-bar title="设备详情" left-arrow @click-left="goBack()" />
    <h4 class="font">{{ plug.alias }}</h4>
    <span class="font">{{ plug.devid }}</span>
    <van-row class="row" justify="center" align="center" type="flex">
      <van-col>
        <van-image width="180" height="200" :src="plug.imgUrl" />
      </van-col>
    </van-row>
    <van-row class="row" justify="center" align="center" type="flex">
      <van-col>
        <van-icon
          @click="plugControl()"
          size="32"
          color="#1989fa"
          :name="require('../assets/svg/power.svg')"
        />
      </van-col>
    </van-row>
  </div>
</template>
<script>
export default {
  name: "Details",
  data() {
    return {
      plug: {
        devid: "",
        alias: "",
        channel0: false,
        energyConsumed: 0.0,
        loadPower: 0.0,
        imgOff: require("../assets/img/plug_off.png"),
        imgOn: require("../assets/img/plug_on.png"),
        imgUrl: require("../assets/img/plug_off.png"),
        color: "#000000",
      },
    };
  },
  methods: {
    goBack() {
      this.$router.push({name: 'Home'});
    },
    initSocket() {
      this.$socket.$subscribe("plug-message", (msg) => {
        if (typeof msg.channel0 !== "undefined") {
          this.plug.channel0 = msg.channel0;
          this.power();
        }
      });
      this.$socket.$subscribe("plug-lost", (devid) => {
        if (devid === this.plug.devid) {
          this.goBack();
        }
      });
    },
    plugControl() {
      this.$socket.client.emit("plug-control", {
        channel0: !this.plug.channel0,
      });
    },
    power() {
      this.plug.imgUrl = this.plug.channel0
        ? this.plug.imgOn
        : this.plug.imgOff;
      this.plug.color = this.plug.channel0 ? "#1989fa" : "#000000";
    },
  },
  created() {
    this.plug.devid = this.$route.params.devid;
    this.plug.alias = this.$route.params.alias;
    this.initSocket();
    this.power();
  },
};
</script>

<style scoped>
.font-color {
  color: #1989fa;
}
.font {
  text-align: center;
}
.row {
  margin-top: 20px;
}
.img {
  margin-left: 0px;
  float: left;
}
.van-cell__title {
  text-align: left;
}
</style>