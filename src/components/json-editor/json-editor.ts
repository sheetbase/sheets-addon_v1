import Vue from 'vue';
import JSONEditor from 'jsoneditor';

import { ErrorAlert, Google } from '../../types';
import { Source, SetMode } from './json-editor.types';

declare const google: Google;
declare const errorAlert: ErrorAlert;

// init
const editor = new JSONEditor(
  document.getElementById('jsoneditor'),
  {
    modes: [ 'tree', 'code', 'text' ],
  },
);

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    // loader
    showLoader: false,
    rawSource: '', // file id or an url or a json://... value
    source: null as Source,
    // advanced
    setMode: 'RAW' as SetMode,
    autoLoaded: false,
  },

  methods: {

    setJsonEditor (jsonText: string) {
      try {
        editor.setText(jsonText);
      } catch (e) {
        return errorAlert('Look like your data is not a valid json value.', 'Bad JSON!');
      }
    },

    /**
     * editor
     */

    clearJSON () {
      return editor.set({});
    },

    getJSON () {
      return google.script.run
      .withSuccessHandler(this.setJsonEditor)
      .withFailureHandler(errorAlert)
      .getData();
    },

    setJSON () {
      const jsonText = editor.getText();
      return google.script.run
      .withFailureHandler(errorAlert)
      .setData(jsonText);
    },

    /**
     * advanced
     */

    /**
     * loader
     */

    resetSource () {
      this.rawSource = '';
      return this.source = null;
    },

    getSource () {
      return google.script.run
      .withSuccessHandler(this.processSource)
      .withFailureHandler(errorAlert)
      .getData();
    },

    processSource (value?: string) {
      value = value || this.rawSource;
      console.log('source changed: ', value);
      // reset
      if (!value) {
        return this.resetSource();
      }
      // possibly a stringified json
      // set to the editor instead
      if (
        (value.substr(0, 1) === '{' && value.substr(-1) === '}') ||
        (value.substr(0, 1) === '[' && value.substr(-1) === ']')
      ) {
        return (
          this.setJsonEditor(value) &&
          this.resetSource()
        );
      }
      const isUrl = (
        value.indexOf('http') !== -1 &&
        value.indexOf('://') !== -1
      );
      const isJsonXUrl = (value.substr(0, 7) === 'json://');
      const isValidId = (
        // usually an 33 characters id, and starts with 1
        // example: 17wmkJn5wDY8o_91kYw72XLT_NdZS3u0W
        value.substr(0, 1) === '1' &&
        value.length > 30 &&
        value.length < 35
      );
      // error, possibly a normal string
      if (!isUrl && !isJsonXUrl && !isValidId) {
        this.resetSource();
        return errorAlert('Invalid source value.');
      }
      // turn file id -> uc url
      if (!isUrl && !isJsonXUrl) {
        value = 'https://drive.google.com/uc?id=' + value;
      }
      // set save as based on the input
      if (!!isJsonXUrl) {
        this.saveAs = 'jsonx';
      } else {
        this.saveAs = 'url';
      }
      // raw source
      this.rawSource = value;
      // parse source
      const url: string = value.replace('json://', '');
      const id: string = (
        url.indexOf('drive.google.com') !== -1 ?
        url.split('uc?id=').pop() : null
      );
      return this.source = {
        raw: this.rawSource,
        isExternal: (!!url && !id),
        value: id || url, // id or url
      };
    },

    loadSource () {
      return google.script.run
      .withSuccessHandler(this.setJsonEditor)
      .withFailureHandler(errorAlert)
      .loadJsonContent(this.source);
    },

    viewSource () {
      const { isExternal, value } = this.source;
      return window.open(
        !!isExternal ? value : 'https://drive.google.com/file/d/' + value + '/view',
      );
    },

  },

});