import Vue from 'vue';

import { ErrorAlert, Google } from '../../types';

declare const google: Google;
declare const errorAlert: ErrorAlert;

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    sources: [],
    selectedSource: null,
    withSource: false,
    // item filter
    filter: '',
    layout: 'list', // list | thumbnail
    // items
    items: [],
    selectedItems: {},
    // modes
    mode: 'key', // key | title | text | custom
    fields: '',
  },
  methods: {

    loadSources () {
      const _this = this;
      return google.script.run
      .withSuccessHandler<string[]>(sources => {
        _this.sources = sources;
      })
      .withFailureHandler(errorAlert)
      .getSources();
    },

    loadItems () {
      console.log('Source changed: ', this.selectedSource);
    },

    selectItem (item: any) {
      console.log('Select item: ', item);
    },

    getPreview () {
      return !!this.selectedCount() ? JSON.stringify(this.selectedItems) : '';
    },

    selectedCount () {
      return Object.keys(this.selectedItems).length;
    },

    totalCount () {
      return this.items.length;
    },

    /**
     * main
     */

    getData () {
      const _this = this;
      return google.script.run
      .withSuccessHandler<string>(value => {
        try {
          _this.selectedItems = JSON.parse(value);
        } catch (e) {
          return errorAlert(
            'Look like your linking value is not valid.',
            'Bad data!',
          );
        }
      })
      .withFailureHandler(errorAlert)
      .getData();
    },

    clearData () {
      this.selectedItems = {};
    },

    setData () {
      const linkingText = JSON.stringify(this.selectedItems);
      return google.script.run
      .withFailureHandler(errorAlert)
      .setData(linkingText);
    },

  },

  created () {
    this.loadSources();
  },

});
