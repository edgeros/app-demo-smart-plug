<template>
  <div class="home">
    <van-nav-bar title="设备列表" safe-area-inset-top />
    <van-pull-refresh
      safe-area-inset-top
      style="min-height: 100vh"
      v-model="isLoading"
      @refresh="onRefresh"
    >
      <van-list style="min-height: 100vh">
        <van-cell
          v-for="(plug, index) of plugs"
          :title="plug.alias"
          :label="plug.devid"
          :key="index"
          is-link="true"
          center="true"
          @click="getPlugDetail(plug)"
        >
          <template #icon>
            <van-image
              width="50"
              height="50"
              :src="require('../assets/img/plug_material.png')"
            />
          </template>
        </van-cell>
      </van-list>
    </van-pull-refresh>
  </div>
</template>
<script>
import axios from "axios";
import { getHeaders } from "../service/auth";
import { edger } from "@edgeros/web-sdk";
import { getActive } from "../service/state";

export default {
  name: "Home",
  data() {
    return {
      plugs: [],
      isLoading: false,
    };
  },
  sockets: {
    connect() {
      this.getPlugList();
      console.log("socket connected");
    },
    connectError() {
      console.log("socket connect error");
    },
    connectTimeout() {
      console.log("socket connect timeout");
    },
    error() {
      console.log("error");
    },
    disconnect() {
      console.log("socket disconnect");
    },
  },
  methods: {
    onRefresh() {
      setTimeout(() => {
        this.isLoading = false;
        this.getPlugList();
      }, 1000);
    },
    initSocket() {
      this.$socket.$subscribe("plug-lost", (devid) => {
        if (getActive()) {
          edger.notify.info(`${devid} 设备已下线`);
        }
        this.plugs = this.plugs.filter((plug) => {
          return plug.devid !== devid;
        });
      });
      this.$socket.$subscribe("plug-join", (plug) => {
        if (getActive()) {
          edger.notify.info(`新上线了 ${plug.alias} 设备`);
        }
        this.plugs.push(plug);
      });
      this.$socket.$subscribe("plug-error", (error) => {
        if (getActive()) {
          if (error.code === 50002) {
            edger.notify.error(`无效设备！`);
          } else {
            edger.notify.error(error.message);
          }
        }
      });
    },
    getPlugList() {
      this.$socket.client.emit("plug-list", (data) => {
        this.plugs = data;
        if (this.plugs.length === 0) {
          if (getActive()) {
            edger.notify.error(`未发现设备！`);
          }
        }
      });
    },
    getPlugDetail(plug) {
      axios
        .post(`/api/select/${plug.devid}`, {}, { headers: getHeaders() })
        .then((res) => {
          if (res.data.result) {
            this.$router.push({ name: "Details", params: plug });
          } else {
            if (getActive()) {
              if (res.data.code === 50004) {
                edger.notify.error(`您没有此设备权限！`);
              } else {
                edger.notify.error(`未知错误！`);
              }
            }
          }
        })
        .catch((error) => {
          console.error(error);
        });
    },
  },
  created() {
    this.initSocket();
    this.getPlugList();
  },
};
</script>
<style scoped>
.img {
  margin-left: 0px;
  float: left;
}
</style>