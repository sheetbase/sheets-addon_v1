import Vue from 'vue';

import { ErrorAlert, Google } from '../../types';

declare const google: Google;
declare const errorAlert: ErrorAlert;

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    ready: false,
    gcpId: '',
  },
  methods: {

    getGCPId () {
      const _this = this;
      return google.script.run
      .withSuccessHandler<string>(gcpId => {
        _this.gcpId = gcpId;
        return _this.ready = true;
      })
      .withFailureHandler(errorAlert)
      .getProperty('SETTING_GCP_ID');
    },

  },

  created () {
    this.getGCPId();
  },

});