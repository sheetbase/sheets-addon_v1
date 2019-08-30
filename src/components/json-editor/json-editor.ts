import Vue from 'vue';
import JSONEditor from 'jsoneditor';

import { ErrorAlert, Google, ProjectSettings, EditorSetMode, EditorData } from '../../types';

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
    hasWebHook: false,
    actionDisabled: false,
    modeCurrentDisabled: true,
    // settings
    setMode: 'RAW' as EditorSetMode,
    source: '', // id or url
    sourceUrl: '', // url
    viewUrl: '',
    autoLoaded: false,
    onDrive: false,
  },

  created () {
    // check if there is the editor hook
    return google.script.run
    .withSuccessHandler<ProjectSettings>(settings =>
      this.hasWebHook = !!settings['WEBHOOK_URL'])
    .getProjectSettings();
  },

  methods: {

    getEditorContent () {
      return editor.getText();
    },

    setEditorContent (content: string) {
      return editor.setText(content);
    },

    getEditorData () {
      return {
        source: this.source,
        sourceUrl: this.sourceUrl,
        viewUrl: this.viewUrl,
        autoLoaded: this.autoLoaded,
        onDrive: this.onDrive,
        content: this.getEditorContent(),
      } as EditorData;
    },

    setEditorData (data: EditorData = {}, keepData = false) {
      const {
        source = '',
        sourceUrl = '',
        viewUrl = '',
        autoLoaded = false,
        onDrive = false,
        content = '{}',
      } = data;
      // update values
      this.source = source;
      this.sourceUrl = sourceUrl;
      this.viewUrl = viewUrl;
      this.autoLoaded = autoLoaded;
      this.onDrive = onDrive;
      // set mode
      if (
        !!source && // has source
        (!!onDrive || !!this.hasWebHook) // in drive or has editor hook
      ) {
        this.modeCurrentDisabled = false;
        this.setMode = 'CURRENT';
      } else {
        this.modeCurrentDisabled = true;
        this.setMode = 'RAW';
      }
      // content
      return !keepData ? this.setEditorContent(content) : null;
    },

    /**
     * buttons
     */

    actionText () {
      if (this.setMode === 'NEW_INTERNAL') {
        return 'New on Drive';
      } else if (this.setMode === 'NEW_EXTERNAL') {
        return 'New remotely';
      } else {
        return 'Save current';
      }
    },

    clearJSON () {
      return this.setEditorContent('{}');
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
        return !!result ? this.setEditorData(result, true) : false;
      };
      // send request
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .saveJsonContent(this.setMode, this.getEditorData());
    },

  },

});