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
      const _this = this;
      return google.script.run
      .withSuccessHandler<any>(settings => {
        _this.homepage = settings['SETTING_HOMEPAGE'];
        _this.gcpId = settings['SETTING_GCP_ID'];
      })
      .withFailureHandler(errorAlert)
      .getProperties();
    },

    getProjectInfo () {
      const _this = this;
      return google.script.run
      .withSuccessHandler<any>(info => {
        _this.projectInfo = info;
        return _this.ready = true;
      })
      .withFailureHandler(errorAlert)
      .getProjectInfo();
    },

    saveSettings () {
      const _this = this;
      return google.script.run
      .withSuccessHandler<void>(() => {
        setTimeout(() => _this.settingsMsg = null, 3000);
        return _this.settingsMsg = {
          type: 'success',
          message: 'Setting updated!',
        };
      })
      .withFailureHandler(errorAlert)
      .setProperties({
        SETTING_HOMEPAGE: _this.homepage,
        SETTING_GCP_ID: _this.gcpId,
      });
    },

  },

  created () {
    this.getProjectInfo();
    this.getSettings();
  },

});