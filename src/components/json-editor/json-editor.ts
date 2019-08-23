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
  data: {},
  methods: {

    clearJSON () {
      return editor.set({});
    },

    getJSON () {
      return google.script.run
      .withSuccessHandler<string>(jsonText => {
        try {
          editor.setText(jsonText);
        } catch (e) {
          return errorAlert(
            'Look like your data is not a valid JSON.',
            'Bad JSON!',
          );
        }
      })
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