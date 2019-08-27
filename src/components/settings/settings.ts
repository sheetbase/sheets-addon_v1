import Vue from 'vue';

import { ErrorAlert, Google } from '../../types';
import { ProjectInfo, SettingActionMessage } from './settings.types';

declare const google: Google;
declare const errorAlert: ErrorAlert;

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    ready: false,
    page: 'general',
    projectInfo: {} as ProjectInfo,
    settingsMsg: null as SettingActionMessage,
  },

  created () {
    this.getProjectInfo();
  },

  methods: {

    getProjectInfo (fresh = false) {
      const successHandler = (props: ProjectInfo) => {
        this.projectInfo = props;
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
        } as SettingActionMessage;
      };
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .setProperties({
        HOMEPAGE: this.projectInfo['HOMEPAGE'],
        GCP_ID: this.projectInfo['GCP_ID'],
        EDITOR_HOOK: this.projectInfo['EDITOR_HOOK'],
      });
    },

  },

});