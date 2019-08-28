import Vue from 'vue';
import JSONEditor from 'jsoneditor';

import { ErrorAlert, Google } from '../../types';
import { ProjectInfo } from '../settings/settings.types';
import { SetMode, LoadResult } from './json-editor.types';

declare const google: Google;
declare const errorAlert: ErrorAlert;

// init
const editor = new JSONEditor(
  document.getElementById('jsoneditor'),
  {
    modes: ['tree', 'code', 'text'],
  },
);

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    hasEditorHook: false,
    // editor
    actionDisabled: false,
    // settings
    source: '',
    setMode: 'RAW' as SetMode,
    autoLoaded: false,
  },

  created () {
    this.getProjectInfo(); // check if there is the editor hook
  },

  methods: {

    getProjectInfo () {
      const successHandler = (info: ProjectInfo) => (
        this.hasEditorHook = !!info.EDITOR_HOOK
      );
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .getProjectInfo();
    },

    setJsonEditor (jsonText: string) {
      return editor.setText(jsonText);
    },

    changeSettings (mode: SetMode, autoLoaded = false) {
      this.autoLoaded = autoLoaded;
      return this.setMode = mode;
    },

    isModeCurrentAvailable () {
      return !!this.source && (
        this.source.indexOf('drive.google.com') !== -1 ||
        !!this.hasEditorHook
      );
    },

    actionText () {
      if (this.setMode === 'NEW_INTERNAL') {
        return 'New on Drive';
      } else if (this.setMode === 'NEW_EXTERNAL') {
        return 'New remotely';
      } else {
        return 'Save current';
      }
    },

    /**
     * editor
     */

    clearJSON () {
      return editor.set({});
    },

    getJSON () {
      const successHandler = (result: LoadResult) => {
        const { source, autoLoaded, jsonText } = result;
        // a stringified json
        if (!source) {
          this.source = '';
          this.changeSettings('RAW');
        } else {
          this.source = source;
          this.changeSettings(
            !!this.isModeCurrentAvailable() ? 'CURRENT' : 'RAW',
            autoLoaded,
          );
        }
        return this.setJsonEditor(jsonText);
      };
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .loadJsonContent();
    },

    setJSON () {
      const successHandler = (resourceUrl: string) => {
        // remove action button disbled
        this.actionDisabled = false;
        // change settings and update source
        if (!!resourceUrl) {
          this.source = resourceUrl;
          this.changeSettings('CURRENT', this.autoLoaded);
        }
      };
      // disable button until success or for 5 seconds
      this.actionDisabled = true;
      setTimeout(() => this.actionDisabled = false, 5000);
      // send request
      const jsonText = editor.getText();
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .saveJsonContent(jsonText, this.source, this.setMode, this.autoLoaded);
    },

  },

});