import Vue from 'vue';
import JSONEditor from 'jsoneditor';

import { ErrorAlert, Google } from '../../types';
import { ProjectInfo } from '../settings/settings.types';
import { SetMode, EditorData } from './json-editor.types';

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
    actionDisabled: false,
    modeCurrentDisabled: true,
    // settings
    source: '', // id or url
    sourceUrl: '', // url
    autoLoaded: false,
    setMode: 'RAW' as SetMode,
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

    actionText () {
      if (this.setMode === 'NEW_INTERNAL') {
        return 'New on Drive';
      } else if (this.setMode === 'NEW_EXTERNAL') {
        return 'New remotely';
      } else {
        return 'Save current';
      }
    },

    setEditorData (data: EditorData = {}, keepData = false) {
      const {
        source = '',
        sourceUrl = '',
        autoLoaded = false,
        jsonText = '{}',
      } = data;
      // update values
      this.source = source;
      this.sourceUrl = sourceUrl;
      this.autoLoaded = autoLoaded;
      // set mode
      if (
        // has source
        !!source &&
        !!sourceUrl &&
        // in drive or has editor hook
        (
          sourceUrl.indexOf('drive.google.com') !== -1 ||
          !!this.hasEditorHook
        )
      ) {
        this.modeCurrentDisabled = false;
        this.setMode = 'CURRENT';
      } else {
        this.modeCurrentDisabled = true;
        this.setMode = 'RAW';
      }
      // data
      return !keepData ? editor.setText(jsonText) : true;
    },

    /**
     * editor
     */

    clearJSON () {
      return editor.set({});
    },

    getJSON () {
      return google.script.run
      .withSuccessHandler(this.setEditorData)
      .withFailureHandler(errorAlert)
      .loadJsonContent();
    },

    setJSON () {
      // disable button until success or for 5 seconds
      this.actionDisabled = true;
      setTimeout(() => this.actionDisabled = false, 5000);
      // success handler
      const successHandler = (result: EditorData) => {
        this.actionDisabled = false;
        // change data
        return this.setEditorData(
          { ... result, autoLoaded: this.autoLoaded } as EditorData,
          true,
        );
      };
      // send request
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .saveJsonContent(editor.getText(), this.setMode, this.source, this.autoLoaded);
    },

  },

});