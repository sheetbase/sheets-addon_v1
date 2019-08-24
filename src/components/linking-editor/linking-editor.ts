import Vue from 'vue';

import { ErrorAlert, Google } from '../../types';

declare const google: Google;
declare const errorAlert: ErrorAlert;

interface Item {
  [field: string]: any;
}

interface CrossedItem extends Item {
  excluded?: boolean;
}

type LinkingValue = true | string | Item;

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    ready: false,
    // data
    linkingData: null as {
      [$key: string]: LinkingValue;
    }, // original loaded data from the active cell
    crossedItems: null as {
      [$key: string]: CrossedItem;
    }, // items from different sources (multiple source linking)
    // source
    sources: [] as string[],
    selectedSource: '' as string, // a name
    includingSource: false, // <key> or <source>:<key>
    // items
    items: [],
    selectedItems: {} as {[$key: string]: Item}, // original selected items
    // items filter
    filter: '',
    showSelectedOnly: false, // display only selected items
    layout: 'list', // list | thumbnail
    // linking modes
    mode: 'key', // text | key | title | custom
    customFields: '',
  },
  methods: {

    processLinkingData () {
      // process linking data
      const selectedItems: {[$key: string]: Item} = {};
      const crossedItems: {[$key: string]: CrossedItem} = {};
      // only when linking data & selected source exists
      if (
        !!this.linkingData &&
        !!this.selectedSource
      ) {
        for (const linkingKey of Object.keys(this.linkingData)) {
          const linkingValue = this.linkingData[linkingKey] as LinkingValue;
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
            let crossedItem: CrossedItem;
            if (linkingValue === true) {
              crossedItem = { title: null }; // title = null; excluded = null
            } else if (typeof linkingValue === 'string') {
              crossedItem = { title: linkingValue };
            } else {
              crossedItem = linkingValue as CrossedItem;
            }
            crossedItems[linkingKey] = crossedItem;
          }
          // from this source
          // add to selected items
          else {
            const key = linkingKey.split(':').pop();
            const item = this.items[key];
            if (!!item) {
              selectedItems[key] = item;
            }
          }
        }
      }
      // save data
      this.selectedItems = selectedItems;
      this.crossedItems = !Object.keys(crossedItems).length ? null : crossedItems;
    },

    /**
     * editor
     */

    loadSources () {
      const successHandler = (sources: string[]) => {
        this.sources = sources;
        return this.ready = true;
      };
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
      const selectedItems = { ... this.selectedItems };
      if (!!selectedItems[item.$key]) {
        delete selectedItems[item.$key]; // remove
      } else {
        selectedItems[item.$key] = item; // add
      }
      return this.selectedItems = selectedItems;
    },

    isItemVisible (item: any): boolean {
      return (!this.showSelectedOnly || !!this.selectedItems[item.$key]);
    },

    getCrossedItemList (): CrossedItem[] {
      const result: CrossedItem[] = [];
      for (const key of Object.keys(this.crossedItems)) {
        result.push(this.crossedItems[key]);
      }
      return result;
    },

    // final result
    getResult () {
      let result: any = {};
      // build result
      if (!!this.selectedCount()) {
        // selected items
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
      // crossed items
      if (!!this.crossedItems) {
        for (const crossedItemKey of Object.keys(this.crossedItems)) {
          const crossedItem: CrossedItem = this.crossedItems[crossedItemKey];
          if (!crossedItem.excluded) {
            result[crossedItemKey] = crossedItem;
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
