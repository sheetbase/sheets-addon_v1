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
    objItems: {} as {[$key: string]: Item}, // cached items as object
    selectedItems: {} as {[source_key: string]: Item}, // selected items
    // items filter
    filter: '',
    showSelectedOnly: false, // display only selected items
    layout: 'thumbnail', // thumbnail | list
    // linking modes
    mode: 'key', // text | key | title | custom
    customFields: '',
  },

  created () {
    this.loadSources();
    this.getData(false); // silently load data from active cell
  },

  methods: {

    processLinkingData () {
      // process linking data
      // only when linking data & selected source exists
      const crossedItems: {[$key: string]: CrossedItem} = {};
      const selectedItems: {[$key: string]: Item} = {};
      if (
        !!this.linkingData &&
        !!this.selectedSource
      ) {
        for (const linkingKey of Object.keys(this.linkingData)) {
          const linkingValue = this.linkingData[linkingKey] as LinkingValue;
          // from this source
          // add to selected items
          if (
            // has <source>
            linkingKey.indexOf(this.selectedSource + ':') !== -1 ||
            // no <source> (only <key>)
            // and assump item exists in this source
            (
              linkingKey.indexOf(':') === -1 &&
              !!this.objItems[linkingKey]
            )
          ) {
            const key = linkingKey.split(':').pop();
            const item = this.objItems[key];
            if (!!item) {
              selectedItems[this.selectedKey(key)] = item;
            }
          }
          // crossed items (multiple linking):
          // not this source
          // or only <key> & not exists in this source
          else {
            let crossedItem: CrossedItem;
            if (!linkingValue || linkingValue === true) {
              crossedItem = { title: null };
            } else if (
              !(linkingValue instanceof Object)
            ) {
              crossedItem = { title: linkingValue };
            } else {
              crossedItem = linkingValue as CrossedItem;
            }
            crossedItems[linkingKey] = crossedItem;
          }
        }
      }
      // save crossed items
      if (!!Object.keys(crossedItems).length) {
        this.crossedItems = { ... crossedItems, ... this.crossedItems };
        this.includingSource = true;
      }
      // save selected items
      this.selectedItems = { ... selectedItems, ... this.selectedItems };
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
      const successHandler = (items: Item[]) => {
        const objItems = {};
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          objItems[item.$key] = item;
        }
        // save data
        this.items = items; // []
        this.objItems = objItems; // {}
      };
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .getData(null, this.selectedSource + '!A1:ZZ', false, false);
    },

    selectedKey (key: string) {
      return this.selectedSource + ':' + key;
    },

    // select/deselect an item
    selectItem (item: Item) {
      const key = this.selectedKey(item.$key);
      const selectedItems = { ... this.selectedItems };
      if (!!selectedItems[key]) {
        delete selectedItems[key]; // remove
      } else {
        selectedItems[key] = item; // add
      }
      return this.selectedItems = selectedItems;
    },

    isItemMatchedFilter (item: Item) {
      const cleanStr = (str: string) => {
        return str.toLowerCase()
        // a-z only
        .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
        .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
        .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
        .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
        .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
        .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
        .replace(/đ/g, 'd')
        // -_ to space
        .replace(/\-|\_/g, ' ');
      };
      const s = cleanStr(this.filter);
      const d = cleanStr(
        item.$key + ' ' +
        (item.description || item.excerpt || '') + ' ' +
        (item.keywords || ''),
      );
      return (!this.filter || d.indexOf(s) !== -1);
    },

    isItemSelected(item: Item) {
      return !!this.selectedItems[this.selectedKey(item.$key)];
    },

    isItemVisible (item: Item): boolean {
      return !!this.isItemMatchedFilter(item) && (
        !this.showSelectedOnly || !!this.isItemSelected(item)
      );
    },

    getCrossedItemList (): CrossedItem[] {
      const result: CrossedItem[] = [];
      for (const key of Object.keys(this.crossedItems)) {
        result.push({
          ... this.crossedItems[key],
          $key: key,
        });
      }
      return result;
    },

    selectCrossedItem (key: string) {
      const crossedItems = { ... this.crossedItems };
      crossedItems[key].excluded = !crossedItems[key].excluded;
      return this.crossedItems = crossedItems;
    },

    buildLinkingValue (item: Item) {
      let value: any;
      if (this.mode === 'key') {
        value = true; // {...: true}
      } else if (
        this.mode === 'text' ||
        this.mode === 'title'
      ) {
        value = item.title;  // {...: '...'}
      } else if (this.mode === 'custom') {
        const customItem = {};
        // build custom item value
        (this.customFields as string)
        .replace(/\,|\.|\||\/|\-|\_/g, ' ')
        .split(' ')
        .forEach(field => {
          field = field.trim();
          if (!!item[field]) {  // has value
            customItem[field] = item[field];
          }
        });
        // set custom item to result
        value = customItem;  // {...: {...}}
      }
      return value;
    },

    // final result
    getResult () {
      const result: any = {};
      // build result
      if (!!this.selectedCount()) {
        // selected items
        for (let key of Object.keys(this.selectedItems)) {
          const item = this.selectedItems[key];
          // save result object according to mode
          key = !!this.includingSource ? key : key.split(':').pop();
          result[key] = this.buildLinkingValue(item);
        }
      }
      // crossed items
      if (!!this.crossedItems) {
        for (const key of Object.keys(this.crossedItems)) {
          const item: CrossedItem = this.crossedItems[key];
          if (!item.excluded) {
            result[key] = this.buildLinkingValue(item);
          }
        }
      }
      // final result
      if (this.mode === 'text') {
        const resultArr: string[] = [];
        for (const key of Object.keys(result)) {
          resultArr.push(result[key] as string);
        }
        return resultArr.join(', '); // string
      } else {
        return !!Object.keys(result).length ? result : null; // object | null
      }
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

});
