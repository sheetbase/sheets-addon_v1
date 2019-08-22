import Vue from 'vue';

import { Google } from '../../types';

declare const google: Google;

function errorAlert(error: string | Error, title?: string) {
  error = (typeof error === 'string') ? new Error(error) : error;
  // show in console
  console.error(error);
  // show in alert
  return google.script.run
  .withFailureHandler(errorAlert)
  .displayError(error.message, title);
}

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    page: 'general',
    // page: general
    homepage: '',
    projectInfo: null,
    settingsFormMessage: null,
    // page: info
    // ...
  },
  methods: {

    getSettings () {
      const _this = this;
      return google.script.run
      .withSuccessHandler<any>(settings => {
        _this.homepage = settings['PROJECT_HOMEPAGE'];
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
        setTimeout(() => _this.settingsFormMessage = null, 3000);
        return _this.settingsFormMessage = {
          type: 'success',
          message: 'Setting updated!',
        };
      })
      .withFailureHandler(errorAlert)
      .setProperties({
        PROJECT_HOMEPAGE: _this.homepage,
      });
    },

    viewFolder (id: string) {
      return window.open('https://drive.google.com/drive/folders/' + id);
    },

    viewScript (id: string) {
      return window.open('https://script.google.com/d/' + id + '/edit');
    },

    viewSheets (id: string) {
      return window.open('https://docs.google.com/spreadsheets/d/' + id + '/edit');
    },

  },

  created () {
    this.getSettings();
    this.getProjectInfo();
  },

});