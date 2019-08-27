import Vue from 'vue';
import JSONEditor from 'jsoneditor';

import { ErrorAlert, Google } from '../../types';

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
    // options
    setMode: 'raw', // raw | url | jsonx (json://...)
    // loader
    showLoader: false,
    loaderValue: '', // in-drive file id or normal url or json://...
  },

  methods: {

    /**
     * utils
     */

    isJsonXUrl (str: string) {
      return str.substr(0, 7) === 'json://'; // json://...
    },

    isUrl (str: string) {
      return str.indexOf('http') !== -1 && str.indexOf('://') !== -1;
    },

    isValidId (str: string) {
      // usually an 33 characters id, and starts with 1
      // example: 17wmkJn5wDY8o_91kYw72XLT_NdZS3u0W
      return (str.substr(0, 1) === '1' && str.length > 30 && str.length < 35);
    },

    isJsonString (str: string) {
      // possibly a stringified json
      return (
        (str.substr(0, 1) === '{' && str.substr(-1) === '}') ||
        (str.substr(0, 1) === '[' && str.substr(-1) === ']')
      );
    },

    /**
     * loader
     */

    loadJsonContent () {
      return google.script.run
      .withSuccessHandler(this.setJsonEditor)
      .withFailureHandler(errorAlert)
      .loadJsonContent(this.loaderValue);
    },

    loadContent () {
      const successHandler = (value: string) => {
        if (!value) {
          return errorAlert('No input value.');
        }
        const isUrl = this.isUrl(value);
        const isJsonXUrl = this.isJsonXUrl(value);
        const isValidId = this.isValidId(value);
        // if a json string, set to the editor instead
        if (!!this.isJsonString(value)) {
          return this.setJsonEditor(value, 'raw');
        }
        // error, possibly a normal string
        if (!isUrl && !isJsonXUrl && !isValidId) {
          return errorAlert('Invalid loader value.');
        }
        // set mode based on the input
        if (!!isJsonXUrl) {
          this.setMode = 'jsonx';
        } else if (!!isUrl) {
          this.setMode = 'url';
        } else {
          this.setMode = 'raw';
        }
        // turn file id -> uc url
        if (!isUrl && !isJsonXUrl) {
          this.setMode = 'url';
          value = 'https://drive.google.com/uc?id=' + value;
        }
        // save loader input
        this.loaderValue = value;
        // load the resource content
        return this.loadJsonContent();
      };
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .getData();
    },

    viewLoaderInput () {
      const url: string = this.loaderValue.replace('json://', '');
      const id: string = url.split('uc?id=').pop();
      return window.open(
        !id ? url : ('https://drive.google.com/file/d/' + id + '/view'),
      );
    },

    /**
     * editor
     */

    setJsonEditor (jsonText: string, setMode?: string) {
      try {
        editor.setText(jsonText);
        this.setMode = setMode || this.setMode; // set mode if provided
      } catch (e) {
        return errorAlert('Look like your data is not a valid json value.', 'Bad JSON!');
      }
    },

    clearJSON () {
      return editor.set({});
    },

    getJSON () {
      return google.script.run
      .withSuccessHandler(value => this.setJsonEditor(value, 'raw'))
      .withFailureHandler(errorAlert)
      .getData();
    },

    setJSON () {
      return google.script.run
      .withFailureHandler(errorAlert)
      .setJsonContent(editor.getText(), this.setMode, this.loaderValue);
    },

  },

});