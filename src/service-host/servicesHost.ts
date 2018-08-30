/* tslint:disable:object-literal-sort-keys */
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import * as constants from './constants';
import { TSInstance } from './interfaces';

/**
 * Create the TypeScript language service
 */
export function makeServicesHost(
  basePath: string,
  scriptRegex: RegExp,
  instance: TSInstance
) {
  const { compiler, compilerOptions, files } = instance;

  const newLine =
    compilerOptions.newLine === constants.CarriageReturnLineFeedCode
      ? constants.CarriageReturnLineFeed
      : compilerOptions.newLine === constants.LineFeedCode
        ? constants.LineFeed
        : constants.EOL;

  const getCurrentDirectory = () => basePath;

  const servicesHost: ts.LanguageServiceHost = {
    getProjectVersion: () => `${instance.version}`,

    getScriptFileNames: () =>
      [...Array.from(files.keys())].filter(filePath =>
        filePath.match(scriptRegex)
      ),

    getScriptVersion: (fileName: string) => {
      fileName = path.normalize(fileName);
      const file = files.get(fileName);
      return file === undefined ? '' : file.version.toString();
    },

    getScriptSnapshot: (fileName: string) => {
      // This is called any time TypeScript needs a file's text
      // We either load from memory or from disk
      fileName = path.normalize(fileName);
      let file = files.get(fileName);

      if (file === undefined) {
        const text = readFile(fileName);
        if (text === undefined) {
          return undefined;
        }

        file = { version: 0, text };
        files.set(fileName, file);
      }

      return compiler.ScriptSnapshot.fromString(file.text!);
    },
    /**
     * getDirectories is also required for full import and type reference completions.
     * Without it defined, certain completions will not be provided
     */
    getDirectories: compiler.sys.getDirectories,

    /**
     * For @types expansion, these two functions are needed.
     */
    directoryExists: compiler.sys.directoryExists,

    useCaseSensitiveFileNames: () => compiler.sys.useCaseSensitiveFileNames,

    // The following three methods are necessary for @types resolution from
    // TS 2.4.1 onwards see: https://github.com/Microsoft/TypeScript/issues/16772
    fileExists: compiler.sys.fileExists,
    readFile: compiler.sys.readFile,
    readDirectory: compiler.sys.readDirectory,

    getCurrentDirectory,

    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: (options: ts.CompilerOptions) =>
      compiler.getDefaultLibFilePath(options),
    getNewLine: () => newLine
  };

  return servicesHost;
}

function readFile(fileName: string, encoding: string | undefined = 'utf8') {
  fileName = path.normalize(fileName);
  try {
    return fs.readFileSync(fileName, encoding);
  } catch (e) {
    return undefined;
  }
}
