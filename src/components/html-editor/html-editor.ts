// tslint:disable:max-line-length
import Vue from 'vue';
import tinymce from 'tinymce';

import { ErrorAlert, Google, ProjectSettings, EditorSetMode, EditorData } from '../../types';

declare const google: Google;
declare const errorAlert: ErrorAlert;

// init editor
// full featured (with free plugin)
// https://www.tiny.cloud/docs/demo/full-featured/
tinymce.init({
  selector: 'textarea#tinymce',
  entity_encoding: 'raw',
  height: 500,
  skin_url: 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.0.14/skins/ui/oxide',
  content_css: [
    'https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.0.14/skins/content/default/content.min.css',
  ],
  // plugins
  // EXCLUDED: bbcode & powerpaste mediaembed tinydrive tinycomments mentions tinymcespellchecker formatpainter linkchecker a11ychecker casechange checklist pageembed permanentpen advcode
  // INCLUDED: code paste spellchecker
  plugins: 'print preview fullpage importcss searchreplace autolink autosave save directionality visualblocks visualchars fullscreen image link media template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists wordcount imagetools textpattern noneditable help charmap quickbars emoticons' + ' code paste spellchecker',
  // menu
  menubar: 'file edit view insert format tools table tc help',
  // toolbar
  toolbar_drawer: 'sliding',
  toolbar: 'undo redo | bold italic underline strikethrough | fontselect fontsizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist checklist | forecolor backcolor casechange permanentpen formatpainter removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media pageembed template link anchor codesample | a11ycheck ltr rtl | showcomments addcomment',
  selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
  // methods
  save_onsavecallback () {
    return app.tinymceOnSaveCallback();
  },
  images_upload_handler (blobInfo, success, failure) {
    return app.tinymceImagesUploadHandler(blobInfo, success, failure);
  },
} as any);

// init vue app
const app = new Vue({
  el: '#vue',
  data: {
    hasWebHook: false,
    actionDisabled: false,
    modeCurrentDisabled: true,
    // settings
    setMode: 'RAW' as EditorSetMode,
    source: '', // id or url
    sourceUrl: '', // url
    viewUrl: '',
    autoLoaded: false,
    onDrive: false,
    // doc loader
    showLoader: false,
    docId: '',
    docStyle: false,
  },

  created () {
    // check if there is the editor hook
    return google.script.run
    .withSuccessHandler<ProjectSettings>(settings =>
      this.hasWebHook = !!settings['WEBHOOK_URL'])
    .getProjectSettings();
  },

  methods: {

    /**
     * tinymce
     */

    tinymceOnSaveCallback () {
      return this.setHTML();
    },

    tinymceImagesUploadHandler (blobInfo, success, failure) {
      return google.script.run
      .withSuccessHandler(success)
      .withFailureHandler(failure)
      .uploadEditorFile(blobInfo.blob());
    },

    /**
     * loader
     */

    loadDocContent () {
      const successHandler = (html: string) => {
        this.showLoader = false;
        return this.setEditorContent(html);
      };
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .loadDocContent(this.docId, this.docStyle);
    },

    viewDoc() {
      return window.open('https://docs.google.com/document/d/' + this.docId + '/view');
    },

    /**
     * editor
     */

    getEditorContent () {
      return tinymce.activeEditor.getContent({ format: 'html' })
      .replace(/\\n/g,'')
      .replace(/\n/g,'')
      .replace('<!DOCTYPE html><html><head></head><body>','')
      .replace('</body></html>','');
    },

    setEditorContent (content: string) {
      return tinymce.activeEditor.setContent(content);
    },

    getEditorData () {
      return {
        source: this.source,
        sourceUrl: this.sourceUrl,
        viewUrl: this.viewUrl,
        autoLoaded: this.autoLoaded,
        onDrive: this.onDrive,
        content: this.getEditorContent(),
      } as EditorData;
    },

    setEditorData (data: EditorData = {}, keepData = false) {
      const {
        source = '',
        sourceUrl = '',
        viewUrl = '',
        autoLoaded = false,
        onDrive = false,
        content = '',
      } = data;
      // update values
      this.source = source;
      this.sourceUrl = sourceUrl;
      this.viewUrl = viewUrl;
      this.autoLoaded = autoLoaded;
      this.onDrive = onDrive;
      // set mode
      if (
        !!source && // has source
        (!!onDrive || !!this.hasWebHook) // in drive or has editor hook
      ) {
        this.modeCurrentDisabled = false;
        this.setMode = 'CURRENT';
      } else {
        this.modeCurrentDisabled = true;
        this.setMode = 'RAW';
      }
      // content
      return !keepData ? this.setEditorContent(content) : null;
    },

    /**
     * editor
     */

    actionText () {
      if (this.setMode === 'NEW_INTERNAL') {
        return 'New on Drive';
      } else if (this.setMode === 'NEW_EXTERNAL') {
        return 'New remotely';
      } else {
        return 'Save current';
      }
    },

    clearHTML () {
      return this.setEditorContent('');
    },

    getHTML () {
      return google.script.run
      .withSuccessHandler(this.setEditorData)
      .withFailureHandler(errorAlert)
      .loadHtmlContent();
    },

    setHTML () {
      // disable button until success or for 5 seconds
      this.actionDisabled = true;
      setTimeout(() => this.actionDisabled = false, 5000);
      // success handler
      const successHandler = (result: EditorData) => {
        this.actionDisabled = false;
        return !!result ? this.setEditorData(result, true) : false;
      };
      // send request
      return google.script.run
      .withSuccessHandler(successHandler)
      .withFailureHandler(errorAlert)
      .saveHtmlContent(this.setMode, this.getEditorData());
    },

  },
});