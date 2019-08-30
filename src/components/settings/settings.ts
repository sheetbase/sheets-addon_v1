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
    settings: {} as ProjectSettings,
    actionMessage: null as ActionMessage,
  },

  created () {
    this.getSettings();
  },

  methods: {

    getSettings (fresh = false) {
      const successHandler = (settings: ProjectSettings) => {
        this.settings = settings;
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
        setTimeout(() => this.actionMessage = null, 3000);
        return this.actionMessage = {
          type: 'success',
          message: 'Setting updated!',
        } as ActionMessage;
      };
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .setProjectSettings(this.settings);
    },

  },

});