import Vue from 'vue';

import { ErrorAlert, Google } from '../../types';

declare const google: Google;
declare const errorAlert: ErrorAlert;

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    ready: false,
    page: 'general',
    // page: general
    projectInfo: null,
    // page: settings
    settingsMsg: null,
    homepage: '',
    gcpId: '',
    // page: info
    // ...
  },
  methods: {

    getSettings () {
      const successHandler = settings => {
        this.homepage = settings['SETTING_HOMEPAGE'];
        this.gcpId = settings['SETTING_GCP_ID'];
      };
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .getProperties();
    },

    getProjectInfo () {
      const successHandler = info => {
        this.projectInfo = info;
        return this.ready = true;
      };
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .getProjectInfo();
    },

    saveSettings () {
      const successHandler = () => {
        setTimeout(() => this.settingsMsg = null, 3000);
        return this.settingsMsg = {
          type: 'success',
          message: 'Setting updated!',
        };
      };
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .setProperties({
        SETTING_HOMEPAGE: this.homepage,
        SETTING_GCP_ID: this.gcpId,
      });
    },

  },

  created () {
    this.getProjectInfo();
    this.getSettings();
  },

});