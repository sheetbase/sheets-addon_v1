import Vue from 'vue';

import { ErrorAlert, Google } from '../../types';

declare const google: Google;
declare const errorAlert: ErrorAlert;

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    ready: false,
    googleCloudId: '',
  },
  methods: {

    getSettings () {
      const _this = this;
      return google.script.run
      .withSuccessHandler<any>(settings => {
        _this.googleCloudId = settings['SETTING_GG_CLOUD_ID'];
        return _this.ready = true;
      })
      .withFailureHandler(errorAlert)
      .getProperties();
    },

  },

  created () {
    this.getSettings();
  },

});