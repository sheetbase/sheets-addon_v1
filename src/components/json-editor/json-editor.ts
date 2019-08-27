import Vue from 'vue';
import JSONEditor from 'jsoneditor';

import { ErrorAlert, Google } from '../../types';
import { SetMode, ParsedLoaderValue } from './json-editor.types';

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
    setMode: 'raw' as SetMode,
    // loader
    showLoader: false,
    loaderValue: '', // in-drive file id or normal url or json://...
    parsedLoaderValue: {} as ParsedLoaderValue,
  },

  methods: {

    /**
     * loader
     */

    loadJsonContent () {
      return google.script.run
      .withSuccessHandler(this.setJsonEditor)
      .withFailureHandler(errorAlert)
      .loadJsonContent(this.parsedLoaderValue);
    },

    loadContent () {
      const successHandler = (value: string) => {
        if (!value) {
          return errorAlert('No input value.');
        }
        // possibly a stringified json
        // set to the editor instead
        if (
          (value.substr(0, 1) === '{' && value.substr(-1) === '}') ||
          (value.substr(0, 1) === '[' && value.substr(-1) === ']')
        ) {
          return this.setJsonEditor(value, 'raw');
        }
        const isUrl = (
          value.indexOf('http') !== -1 &&
          value.indexOf('://') !== -1
        );
        const isJsonXUrl = (
          value.substr(0, 7) === 'json://'
        );
        const isValidId = (
          // usually an 33 characters id, and starts with 1
          // example: 17wmkJn5wDY8o_91kYw72XLT_NdZS3u0W
          value.substr(0, 1) === '1' &&
          value.length > 30 &&
          value.length < 35
        );
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
        // save loader value
        this.loaderValue = value;
        // parse save loader value
        const url: string = (value || '').replace('json://', '');
        const id: string = (
          url.indexOf('drive.google.com') !== -1 ?
          url.split('uc?id=').pop() : null
        );
        this.parsedLoaderValue = { isExternal: (!!url && !id), value: id || url };
        // load content
        return this.loadJsonContent();
      };
      return !!this.loaderValue ?
      successHandler(this.loaderValue) :
      google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .getData();
    },

    /**
     * editor
     */

    setJsonEditor (jsonText: string, setMode?: SetMode) {
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
      const jsonText = editor.getText();
      return google.script.run
      .withFailureHandler(errorAlert)
      .setData(jsonText);
    },

  },

});