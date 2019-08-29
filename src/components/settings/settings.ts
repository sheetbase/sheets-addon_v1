import Vue from 'vue';

import { ErrorAlert, Google, ActionMessage, ProjectInfo, ProjectCustomInfo } from '../../types';

declare const google: Google;
declare const errorAlert: ErrorAlert;

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    ready: false,
    page: 'general',
    projectInfo: {} as ProjectInfo,
    settingsMsg: null as ActionMessage,
  },

  created () {
    this.getProjectInfo();
  },

  methods: {

    getProjectInfo (fresh = false) {
      const successHandler = (info: ProjectInfo) => {
        this.projectInfo = info;
        return this.ready = true;
      };
      this.ready = false; // reset ready status
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .getProjectInfo(fresh);
    },

    saveSettings () {
      const successHandler = () => {
        setTimeout(() => this.settingsMsg = null, 3000);
        return this.settingsMsg = {
          type: 'success',
          message: 'Setting updated!',
        } as ActionMessage;
      };
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .setProjectCustomInfo({
        HOMEPAGE: this.projectInfo['HOMEPAGE'],
        GCP_ID: this.projectInfo['GCP_ID'],
        WEBHOOK_URL: this.projectInfo['WEBHOOK_URL'],
      } as ProjectCustomInfo);
    },

  },

});