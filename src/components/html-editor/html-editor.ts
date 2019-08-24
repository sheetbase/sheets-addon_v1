// tslint:disable:max-line-length
import Vue from 'vue';
import tinymce from 'tinymce';

import { ErrorAlert, Google } from '../../types';

declare const google: Google;
declare const errorAlert: ErrorAlert;

// init editor
// full featured (with free plugin)
// https://www.tiny.cloud/docs/demo/full-featured/
tinymce.init({
  selector: 'textarea#tinymce',
  entity_encoding: 'raw',
  base_url: 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.0.14',
  content_css: false,
  height: 500,
  // plugins
  // EXCLUDED: bbcode & powerpaste mediaembed tinydrive tinycomments mentions tinymcespellchecker formatpainter linkchecker a11ychecker casechange checklist pageembed permanentpen advcode
  // INCLUDED: code paste spellchecker
  plugins: 'print preview fullpage importcss searchreplace autolink autosave save directionality visualblocks visualchars fullscreen image link media template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists wordcount imagetools textpattern noneditable help charmap quickbars emoticons' + ' code paste spellchecker',
  // menu
  menubar: 'file edit view insert format tools table tc help',
  // toolbar
  toolbar_drawer: 'sliding',
  toolbar: 'undo redo | bold italic underline strikethrough | fontselect fontsizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist checklist | forecolor backcolor casechange permanentpen formatpainter removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media pageembed template link anchor codesample | a11ycheck ltr rtl | showcomments addcomment' + ' | code paste spellchecker',
  selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
} as any);

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    docId: '',
    docStyle: false,
  },
  methods: {

    /**
     * loader
     */

    getDocId () {
      const successHandler = (docId: string) => {
        this.docId = docId;
        return this.loadDocContent();
      };
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .getData();
    },

    loadDocContent () {
      // try to load from the active cell
      if (!this.docId) {
        return this.getDocId();
      } else {
        const successHandler = (html: string) => {
          if(!html) {
            return errorAlert('Can not get the Doc content!');
          }
          return tinymce.activeEditor.setContent(html);
        };
        // load content
        return google.script.run
        .withSuccessHandler(successHandler)
        .withFailureHandler(errorAlert)
        .getDocsContent(this.docId, !this.docStyle);
      }
    },

    viewDoc() {
      return window.open('https://docs.google.com/document/d/' + this.docId + '/view');
    },

    /**
     * editor
     */

    clearHTML () {
      return tinymce.activeEditor.setContent('');
    },

    getHTML () {
      return google.script.run
      .withSuccessHandler<string>(data => {
        return tinymce.activeEditor.setContent(data);
      })
      .withFailureHandler(errorAlert)
      .getData();
    },

    setHTML () {
      const html = tinymce.activeEditor.getContent({ format: 'html' })
        .replace(/\\n/g,'')
        .replace(/\n/g,'')
        .replace('<!DOCTYPE html><html><head></head><body>','')
        .replace('</body></html>','');
      return google.script.run
      .withFailureHandler(errorAlert)
      .setData(html);
    },

  },
});