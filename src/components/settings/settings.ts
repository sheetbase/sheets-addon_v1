import Vue from 'vue';

import { ErrorAlert, Google, ActionMessage, ProjectSettings } from '../../types';

declare const google: Google;
declare const errorAlert: ErrorAlert;

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    ready: false,
    page: 'general',
    projectSettings: {} as ProjectSettings,
    settingsMsg: null as ActionMessage,
  },

  created () {
    this.getSettings();
  },

  methods: {

    getSettings (fresh = false) {
      const successHandler = (settings: ProjectSettings) => {
        this.projectSettings = settings;
        return this.ready = true;
      };
      this.ready = false; // reset ready status
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .getProjectSettings(fresh);
    },

    setSettings () {
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
      .setProjectSettings(this.projectSettings);
    },

  },

});