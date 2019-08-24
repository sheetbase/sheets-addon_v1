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
      const successHandler = (gcpId: string) => {
        this.gcpId = gcpId;
        return this.ready = true;
      };
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .getProperty('SETTING_GCP_ID');
    },

  },

  created () {
    this.getGCPId();
  },

});