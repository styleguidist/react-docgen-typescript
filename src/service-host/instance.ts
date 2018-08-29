import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { TSFile, TSFiles, TSInstance } from './interfaces';
import { makeServicesHost } from './servicesHost';

let existingInstance: TSInstance | null = null;

function ensureProgram() {
  if (existingInstance && existingInstance.watchHost) {
    if (existingInstance.hasUnaccountedModifiedFiles) {
      if (existingInstance.changedFilesList) {
        existingInstance.watchHost.updateRootFileNames();
      }
      if (existingInstance.watchOfFilesAndCompilerOptions) {
        existingInstance.program = existingInstance.watchOfFilesAndCompilerOptions
          .getProgram()
          .getProgram();
      }
      existingInstance.hasUnaccountedModifiedFiles = false;
    }
    return existingInstance.program;
  }
  return undefined;
}

/**
 * The parser is executed once for each file. However, we need to keep
 * a persistent instance of TypeScript that contains all of the files in the program
 * along with definition files and options. This function either creates an instance
 * or returns the existing one.
 */
export function getTypeScriptInstance(
  basePath: string,
  compilerOptions: ts.CompilerOptions
) {
  if (existingInstance) {
    ensureProgram();
    return { instance: existingInstance };
  }

  return successfulTypeScriptInstance(basePath, compilerOptions);
}

function successfulTypeScriptInstance(
  basePath: string,
  compilerOptions: ts.CompilerOptions
) {
  const files: TSFiles = new Map<string, TSFile>();
  const otherFiles: TSFiles = new Map<string, TSFile>();

  const configParseResult = ts.parseJsonConfigFileContent(
    compilerOptions,
    ts.sys,
    basePath
  );

  // Load initial files (core lib files, any files specified in tsconfig.json)
  let normalizedFilePath: string;
  const filesToLoad = configParseResult.fileNames;
  filesToLoad.forEach(filePath => {
    normalizedFilePath = path.normalize(filePath);
    files.set(normalizedFilePath, {
      text: fs.readFileSync(normalizedFilePath, 'utf-8'),
      version: 0
    });
  });

  // if allowJs is set then we should accept js(x) files
  const scriptRegex = configParseResult.options.allowJs
    ? /\.tsx?$|\.jsx?$/i
    : /\.tsx?$/i;

  const instance: TSInstance = (existingInstance = {
    compiler: ts,
    compilerOptions,
    dependencyGraph: {},
    files,
    languageService: null,
    modifiedFiles: null,
    otherFiles,
    reverseDependencyGraph: {},
    version: 0
  });

  const servicesHost = makeServicesHost(basePath, scriptRegex, instance);
  instance.languageService = ts.createLanguageService(
    servicesHost,
    ts.createDocumentRegistry()
  );

  return { instance };
}
