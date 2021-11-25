import Vue from "vue";

const VERSION = "/v1";

let domain = "https://api.spotify.com";

export const request = (method, url, data, options) => {
  let mainUrl = domain + VERSION + url;
  let acceptUnAuth = false;
  let requestParams = {};
  let showLoading = true;
  let vHasFullResponse = false;
  let contentType = null;
  if (options !== undefined && typeof options === "object") {
    //isUrl: Do not use /api/v1
    if (options.isUrl) {
      mainUrl = domain + url;
    }
    //acceptUnAuth: Accept Unauthorized status
    if (options.acceptUnAuth) {
      acceptUnAuth = options.acceptUnAuth;
    }
    //isPrivacy: Call API of Privacy Policy
    if (options.isPrivacy) {
      mainUrl = domainPrivacy + VERSION + url;
    }
    // showLoading: Show/Hide Loading dialog
    if (
      options.showLoading !== null &&
      options.showLoading !== undefined &&
      options.showLoading === false
    ) {
      showLoading = options.showLoading;
    }
    // queryOptions: Call API with special query params
    if (options.queryOptions && typeof options.queryOptions === "object") {
      requestParams = options.queryOptions;
    }
    if (options.hasFullResponse) {
      vHasFullResponse = options.hasFullResponse;
    }
    if (options.contentType) {
      contentType = options.contentType;
    }
  }
  return Vue.axios({
    method: method,
    url: mainUrl,
    data: data,
    params: requestParams,
    showLoading: showLoading,
    acceptUnAuth: acceptUnAuth,
    contentType: contentType
  })
    .then(result => {
      if (vHasFullResponse) {
        return result;
      }
      return result.data;
    })
    .catch(result => {      
      if (result.message === "Network Error") {
        throw result;
      } else {
        if(result.response.status) {
          if (result.response.status === UNAUTHORIZED && !acceptUnAuth) {
            onUnauthorized();
          }
          throw result.response;
        } else {
          throw result;
        }
      }      
    });
};
