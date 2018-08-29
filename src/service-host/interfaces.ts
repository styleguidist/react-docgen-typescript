import * as ts from 'typescript';

export interface WatchHost
  extends ts.WatchCompilerHostOfFilesAndCompilerOptions<ts.BuilderProgram> {
  invokeFileWatcher(fileName: string, eventKind: ts.FileWatcherEventKind): void;
  invokeDirectoryWatcher(directory: string, fileAddedOrRemoved: string): void;
  updateRootFileNames(): void;
}

export interface TSInstance {
  compiler: typeof ts;
  compilerOptions: ts.CompilerOptions;
  // loaderOptions: LoaderOptions;
  /**
   * a cache of all the files
   */
  files: TSFiles;
  /**
   * contains the modified files - cleared each time after-compile is called
   */
  modifiedFiles?: TSFiles | null;
  languageService?: ts.LanguageService | null;
  version?: number;
  dependencyGraph: DependencyGraph;
  reverseDependencyGraph: ReverseDependencyGraph;
  filesWithErrors?: TSFiles;
  // transformers: ts.CustomTransformers;
  // colors: Chalk;

  otherFiles: TSFiles;
  watchHost?: WatchHost;
  watchOfFilesAndCompilerOptions?: ts.WatchOfFilesAndCompilerOptions<
    ts.BuilderProgram
  >;
  program?: ts.Program;
  hasUnaccountedModifiedFiles?: boolean;
  changedFilesList?: boolean;
}

export interface DependencyGraph {
  [file: string]: ResolvedModule[] | undefined;
}

export interface ReverseDependencyGraph {
  [file: string]:
    | {
        [file: string]: boolean;
      }
    | undefined;
}

export interface TSFile {
  text?: string;
  version: number;
}

/** where key is filepath */
export type TSFiles = Map<string, TSFile>;

export interface ResolvedModule {
  originalFileName: string;
  resolvedFileName: string;
  resolvedModule?: ResolvedModule;
  isExternalLibraryImport?: boolean;
}
