import Vue from "vue";
import App from "./App";
import vuetify from "../plugins/vuetify";
import dayjs from "dayjs";

import TabPlaceholder from "../components/TabPlaceholder";

global.browser = require("webextension-polyfill");
Vue.prototype.$browser = global.browser;

Vue.filter("filterDate", (val) => {
  if (!val) return;

  return dayjs(val).format("MMMM D, YYYY, h:mm:ss a");
});
Vue.filter("scale", (val, scale = 9) => {
  if (!val) return;

  return Number(val).toFixed(scale);
});
Vue.component("tab-placeholder", TabPlaceholder);

/* eslint-disable no-new */
new Vue({
  el: "#app",
  vuetify,
  render: (h) => h(App),
});
