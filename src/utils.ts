import * as path from 'path';

export function trimFileName(fileName: string) {
  // We'll use the currentDirectoryName to trim parent fileNames
  const currentDirectoryPath = process.cwd();
  const currentDirectoryParts = currentDirectoryPath.split(path.sep);
  const currentDirectoryName =
    currentDirectoryParts[currentDirectoryParts.length - 1];

  const fileNameParts = fileName.split('/');
  const idx = fileNameParts.lastIndexOf(currentDirectoryName);
  return fileNameParts.slice(idx, fileNameParts.length).join('/');
}
