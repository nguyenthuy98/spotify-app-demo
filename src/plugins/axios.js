"use strict";

import Vue from "vue";
import axios from "axios";
import store from "@/store";

import {
  SHOW_LOADING,
  HIDE_LOADING,
  SHOW_ERROR,
  LOGOUT
} from "@/store/types/actions.type";

import Utils from "@/common/utils";
import { STORAGE_ACCESS_TOKEN,STORAGE_RM, STATUS_CODE } from "@/common/constants";

// Full config:  https://github.com/axios/axios#request-config
// axios.defaults.baseURL = process.env.baseURL || process.env.apiUrl || '';

axios.defaults.headers.common["Content-Encoding"] = "gzip";

axios.defaults.headers.common["Access-Token"] = Utils.getSessionStorage(
  STORAGE_ACCESS_TOKEN
);

axios.defaults.headers.get["Pragma"] = "no-cache";
axios.defaults.headers.get["Cache-Control"] = "no-cache, no-store";

let config = {
  // baseURL: process.env.baseURL || process.env.apiUrl || ""
  // timeout: 60 * 1000, // Timeout
  //withCredentials: true // Check cross-site Access-Control
};

const _axios = axios.create(config);
let apiRequestCount = 0;

_axios.interceptors.request.use(
  config => {
    const showLoading = config.showLoading;
    if (config.contentType) {
      axios.defaults.headers.common["Content-Type"] = config.contentType;
    }
    // let vAcceptUnAuth = false;
    // if (config.acceptUnAuth !== null && config.acceptUnAuth) {
    //   vAcceptUnAuth = config.acceptUnAuth;
    // }
    if(JSON.parse(Utils.getSessionStorage(STORAGE_RM))) {      
      config.headers["Authorization"] =
        "Basic Y29tbXVmYWNjOmNvbW11ZmFybW1wd2Q=";
    }
    if (!showLoading) {
    } else {
      apiRequestCount++;
      if (apiRequestCount === 1) {
        store.dispatch(SHOW_LOADING);
      }
    }
    
    return config;
  },
  error => {
    // Do something with request error
    apiRequestCount = 0;
    store.dispatch(SHOW_ERROR, error);
    store.dispatch(LOGOUT);
    return Promise.reject(error);
  }
);

// Add a response interceptor
_axios.interceptors.response.use(
  response => {
    // Do something with response data
    if (apiRequestCount > 0) {
      apiRequestCount--;
    }
    if (apiRequestCount === 0) {
      store.dispatch(HIDE_LOADING);
    }
    return response;
  },
  error => {
    // Do something with response error
    let vAcceptUnAuth = false;
    if (error.config.acceptUnAuth !== null && error.config.acceptUnAuth) {
      vAcceptUnAuth = error.config.acceptUnAuth;
    }
    const url = error.config.url;
    // if(apiRequestCount > 0) {
      if (vAcceptUnAuth) {
        // Do not thing
        store.dispatch(HIDE_LOADING);
      } else {
        apiRequestCount = 0;
        if (error.message !== "Network Error") {
          store.dispatch(HIDE_LOADING);
  
          /* Show error if need */
          const vStatus = error.response.status;
  
          if (vStatus) {
            if(vStatus === STATUS_CODE.UNAUTHORIZED) {
               if(!JSON.parse(Utils.getSessionStorage(STORAGE_RM))) {
                store.dispatch(SHOW_ERROR, error);
               }
            } else {
              if(url.indexOf("/gateway/nopassword") < 0) {
                store.dispatch(SHOW_ERROR, error);
              }
            }
            //check no password api, pass if url is nopassword
            if(url.indexOf("/gateway/nopassword") >= 0) {
              if(
                vStatus === STATUS_CODE.NO_RESOURCE ||
                vStatus === STATUS_CODE.NOT_IMPLEMENTED
              ) {
                Utils.setSessionStorage(STORAGE_RM, "false");
              }
            }
          }

          if (vStatus) {
            if(vStatus === STATUS_CODE.UNAUTHORIZED) {
              store.dispatch(LOGOUT);
            }
          }
        }
      }
    // }   

    return Promise.reject(error);
  }
);

// eslint-disable-next-line no-unused-vars
const axiosPlugin = {};
axiosPlugin.install = (Vue, options) => {
  Vue.axios = _axios;
  window.axios = _axios;
  Object.defineProperties(Vue.prototype, {
    axios: {
      get() {
        return _axios;
      }
    },
    $axios: {
      get() {
        return _axios;
      }
    }
  });
};

Vue.use(axiosPlugin);

export default axiosPlugin;
