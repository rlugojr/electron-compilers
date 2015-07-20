'use babel';

import CompileCache from 'electron-compile-cache';
import cheerio from 'cheerio';

const extensions = ['html', 'htm'];

const mimeTypeToExtension = {
  'text/less': 'less',
  'text/scss': 'scss',
  'text/sass': 'sass',
  'application/javascript': 'js',
  'application/coffeescript': 'coffee',
  'application/typescript': 'ts'
};

export default class InlineHtmlCompiler extends CompileCache {
  constructor(compileMethod) {
    super();
    
    this.innerCompile = compileMethod;
    this.compilerInformation = { extensions: extensions };
  }
  
  static getExtensions() {
    return extensions;
  }

  getCompilerInformation() {
    return this.compilerInformation;
  }

  compile(sourceCode, filePath) {
    let $ = cheerio.load(sourceCode);
    
    $('style').map((i, el) => {
      let mimeType = $(el).attr('type');
      let path = `${filePath}:inline_${i}.${this.getExtensionFromMimeType(mimeType, 'style')}`;
      
      $(el).text("\n" + this.innerCompile($(el).text(), path) + "\n");
      $(el).attr('type', 'text/css');
    });
    
    $('script').map((i, el) => {
      let src = $(el).attr('src');
      if (src && src.length > 2) return;
      
      let mimeType = $(el).attr('type');
      let path = `${filePath}:inline_${i}.${this.getExtensionFromMimeType(mimeType, 'script')}`;
      
      $(el).text("\n" + this.innerCompile($(el).text(), path) + "\n");
      $(el).attr('type', 'text/javascript');
    });
    
    return $.html();
  }

  getMimeType() { return 'text/html'; }

  register() {}

  initializeCompiler() {
    // XXX: Ugh, this is terrible but close enough
    return require('../package.json').version;
  }
  
  getExtensionFromMimeType(mimeType, tagType) {
    let defaultType = (tagType === 'style' ? 'less' : 'js');
    
    if (!mimeType || mimeType.length < 2) return defaultType;
    return mimeTypeToExtension[mimeType] || defaultType;
  }
}