import Vue from 'vue';

import { ErrorAlert, Google } from '../../types';
import { ProjectInfo } from '../settings/settings.types';

declare const google: Google;
declare const errorAlert: ErrorAlert;

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    ready: false,
    gcpId: '',
  },

  created () {
    this.getGCPId();
  },

  methods: {

    getGCPId () {
      const successHandler = (projectInfo: ProjectInfo) => {
        this.gcpId = projectInfo.GCP_ID;
        return this.ready = true;
      };
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .getProjectInfo();
    },

  },

});