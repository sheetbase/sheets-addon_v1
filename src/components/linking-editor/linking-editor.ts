import Vue from 'vue';

import { ErrorAlert, Google } from '../../types';

declare const google: Google;
declare const errorAlert: ErrorAlert;

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    // data
    linkingData: null, // original loaded data from the active cell
    crossedItems: null, // items from different sources (multiple source linking)
    // source
    sources: [],
    selectedSource: null, // a name
    includingSource: false, // <key> or <source>:<key>
    // items
    items: [],
    selectedItems: {}, // original selected items
    // items filter
    filter: '',
    showSelectedOnly: false, // display only selected items
    layout: 'list', // list | thumbnail
    // linking modes
    mode: 'key', // text | key | title | custom
    customFields: '',
  },
  methods: {

    // TODO: display crossed item list for including/excluding in the result

    processLinkingData () {
      // only when linking data & selected source exists
      if (
        !!this.linkingData &&
        !!this.selectedSource
      ) {
        // process linking data
        const crossedItems = {};
        for (const linkingKey of Object.keys(this.linkingData)) {
          // crossed items (multiple linking):
          // only <key> not exists in this source
          // or not this source
          if (
            // not this source
            linkingKey.indexOf(this.selectedSource + ':') === -1 ||
            // only <key> not exists in this source
            (
              linkingKey.indexOf(':') === -1 && // no source (<key> only)
              !this.items[linkingKey] // not in this source
            )
          ) {
            crossedItems[linkingKey] = this.linkingData[linkingKey];
          }
          // TODO: from this source
          else {

          }
        }
        // save data
        this.crossedItems = !Object.keys(crossedItems).length ? null : crossedItems;
      }
    },

    /**
     * editor
     */

    loadSources () {
      const successHandler = (sources: string[]) => this.sources = sources;
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .getLinkingSources();
    },

    changeSource () {
      // load items
      this.loadItems();
      // re-process linking data when source changed
      return this.processLinkingData();
    },

    loadItems () {
      const successHandler = (items: any[]) => this.items = items;
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .getData(null, this.selectedSource + '!A1:ZZ', false, false);
    },

    // select/deselect an item
    selectItem (item: any) {
      return !!this.selectedItems[item.$key] ?
        delete this.selectedItems[item.$key] :
        this.selectedItems[item.$key] = item;
    },

    isVisible (item: any): boolean {
      return (!this.showSelectedOnly || !!this.selectedItems[item.$key]);
    },

    // final result
    getResult () {
      let result: any = {};
      // build result
      if (!!this.selectedCount()) {
        for (const key of Object.keys(this.selectedItems)) {
          const selectedItem = this.selectedItems[key];
          const resultKey = !!this.includingSource ? (this.selectedSource + ':' + key) : key;
          // save result object according to mode
          if (this.mode === 'key' ) {
            result[resultKey] = true; // {...: true}
          } else if (
            this.mode === 'text' ||
            this.mode === 'title' ||
            (
              this.mode === 'custom' &&
              !!this.customFields
            )
          ) {
            result[resultKey] = selectedItem.title;  // {...: '...'}
          } else if (this.mode === 'custom') {
            const customItem = {};
            // build custom item value
            (this.customFields as string)
            .replace(/\,|\.|\||\/|\-|\_/g, ' ')
            .split(' ')
            .forEach(field => {
              field = field.trim();
              return !selectedItem[field] ? false : // no value
                customItem[field] = selectedItem[field]; // has value
            });
            // set custom item to result
            result[resultKey] = customItem;  // {...: {...}}
          }
        }
      }
      // finalize result
      if (this.mode === 'text') {
        const resultArr: string[] = [];
        for (const key of Object.keys(result)) {
          resultArr.push(result[key] as string);
        }
        result = resultArr.join(', ');
      }
      // object or string or null
      return (typeof result === 'string') ? result : ( // string
        !!Object.keys(result).length ? result : null // object | null
      );
    },

    getResultAsString (format = false): string {
      const result = this.getResult();
      return !result ? '' : ( // null
        (typeof result === 'string') ? result : // string
          JSON.stringify(result, null, !!format ? 2 : 0) // stringified object
      );
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

    getData (emitError = true) {
      const successHandler = (value: string) => {
        try {
          this.linkingData = JSON.parse(value);
          // process linking data
          this.processLinkingData();
        } catch (e) {
          return !emitError ? false : errorAlert(
            'Look like your linking value is not valid.',
            'Bad data!',
          );
        }
      };
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .getData();
    },

    clearData () {
      this.selectedItems = {};
    },

    setData () {
      const resultText = this.getResultAsString();
      if (!!resultText) {
        return google.script.run
        .withFailureHandler(errorAlert)
        .setData(resultText);
      }
    },

  },

  created () {
    this.loadSources();
    this.getData(false); // silently load data from active cell
  },

});
