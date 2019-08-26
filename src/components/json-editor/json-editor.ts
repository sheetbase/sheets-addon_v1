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
    mode: 'data', // set mode: data | url (json:// url)
    // loader
    loaderInput: '', // in-drive file id or normal url or json:// url
  },

  methods: {

    /**
     * utils
     */

    isJsonUrl (str: string) {
      return str.substr(0, 7) === 'json://';
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
      if (!!this.isJsonUrl(value)) {
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

    loadJsonContentByFileId (id: string) {
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

    loadJSON () {
      const successHandler = (value: string) => {
        if (!!value) {

          // not valid: possible a stringified json
          // set to the editor instead
          if (
            (value.substr(0, 1) === '{' && value.substr(-1) === '}') ||
            (value.substr(0, 1) === '[' && value.substr(-1) === ']')
          ) {
            return editor.setText(value);
          }

          // not valid: possible a normal string
          if (
            // not a normal url
            !this.isUrl(value) &&
            // not a json:// url
            !this.isJsonUrl(value) &&
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

          // process loader input
          this.loaderInput = value;
          // load the content
          const { id, url } = this.parseLoaderInput(value);
          return !!id ?
            this.loadJsonContentByFileId(id) :
            this.loadJsonContentByUrl(url);
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

    setJsonEditor (jsonText: string) {
      try {
        editor.setText(jsonText);
      } catch (e) {
        return errorAlert('Look like your data is not a valid json value.', 'Bad JSON!');
      }
    },

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

  },

});