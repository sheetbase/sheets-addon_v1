import Vue from 'vue';

import { ErrorAlert, Google } from '../../types';

declare const google: Google;
declare const errorAlert: ErrorAlert;

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    page: 'general',
    // page: general
    projectInfo: null,
    // page: settings
    settingsMsg: null,
    homepage: '',
    googleCloudId: '',
    // page: info
    // ...
  },
  methods: {

    getSettings () {
      const _this = this;
      return google.script.run
      .withSuccessHandler<any>(settings => {
        _this.homepage = settings['SETTING_HOMEPAGE'];
        _this.googleCloudId = settings['SETTING_GG_CLOUD_ID'];
      })
      .withFailureHandler(errorAlert)
      .getProperties();
    },

    getProjectInfo () {
      const _this = this;
      return google.script.run
      .withSuccessHandler<any>(info => _this.projectInfo = info)
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
        SETTING_GG_CLOUD_ID: _this.googleCloudId,
      });
    },

  },

  created () {
    this.getSettings();
    this.getProjectInfo();
  },

});