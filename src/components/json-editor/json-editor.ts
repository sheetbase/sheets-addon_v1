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
    mode: 'raw', // set mode: raw | url | jsonx (json://...)
    // loader
    loaderInput: '', // in-drive file id or normal url or json://...
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

    /**
     * loader
     */

    parseLoaderInput (value: string) {
      // get id or url
      let id: string = null;
      let url: string = null;
      // json:// url
      if (!!this.isJsonXUrl(value)) {
        // in-drive url
        if (value.indexOf('drive.google.com/uc') !== -1) {
          id = value.split('?id=').pop();
        }
        // url
        else {
          url = value.replace('json://', '');
        }
      }
      // url
      else if (!!this.isUrl(value)) {
        url = value;
      }
      // id
      else {
        id = value;
      }
      // return value
      return { id, url };
    },

    loadJsonContentById (id: string) {
      return google.script.run
      .withSuccessHandler(this.setJsonEditor)
      .withFailureHandler(errorAlert)
      .loadJsonContentByFileId(id);
    },

    loadJsonContentByUrl (url: string) {
      return google.script.run
      .withSuccessHandler(this.setJsonEditor)
      .withFailureHandler(errorAlert)
      .loadJsonContentByUrl(url);
    },

    loadContent () {
      const successHandler = (value: string) => {
        if (!!value) {
          // NOT VALID
          // possibly a stringified json
          // set to the editor instead
          if (
            (value.substr(0, 1) === '{' && value.substr(-1) === '}') ||
            (value.substr(0, 1) === '[' && value.substr(-1) === ']')
          ) {
            return this.setJsonEditor(value, 'raw');
          }
          // NOT VALID
          // possibly a normal string
          if (
            // not a normal url
            !this.isUrl(value) &&
            // not a json:// url
            !this.isJsonXUrl(value) &&
            // not a valid id
            // usually an 33 characters id, and start with 1
            // example: 17wmkJn5wDY8o_91kYw72XLT_NdZS3u0W
            (
              value.substr(0, 1) !== '1' ||
              value.length < 30 ||
              value.length > 35
            )
          ) {
            return errorAlert(
              'Look like the current value is an invalid loader input.',
              'Invalid value',
            );
          }
          // VALID
          // set mode based on
          if (!!this.isJsonXUrl(value)) {
            this.mode = 'jsonx';
          } else if (!!this.isUrl(value)) {
            this.mode = 'url';
          } else {
            this.mode = 'raw';
          }
          // save loader input
          this.loaderInput = value;
          // load the content by id or url
          const { id, url } = this.parseLoaderInput(value);
          return !!id ? this.loadJsonContentById(id) : this.loadJsonContentByUrl(url);
        }
      };
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .getData();
    },

    viewLoaderInput () {
      const { id, url } = this.parseLoaderInput(this.loaderInput);
      return window.open(
        url || 'https://drive.google.com/file/d/' + id + '/view',
      );
    },

    /**
     * editor
     */

    setJsonEditor (jsonText: string, mode?: string) {
      try {
        editor.setText(jsonText);
        this.mode = mode || this.mode; // set mode if provided
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
      const { id, url } = this.parseLoaderInput(this.loaderInput);
      return google.script.run
      .withFailureHandler(errorAlert)
      .setJsonContent(jsonText, this.mode, url, id);
    },

  },

});