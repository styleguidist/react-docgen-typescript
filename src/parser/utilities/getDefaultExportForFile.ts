import * as ts from "typescript";
import * as path from "path";

// Default export for a file: named after file
export function getDefaultExportForFile(source: ts.SourceFile) {
  const name = path.basename(source.fileName, path.extname(source.fileName));
  const filename =
    name === "index" ? path.basename(path.dirname(source.fileName)) : name;

  // JS identifiers must starts with a letter, and contain letters and/or numbers
  // So, you could not take filename as is
  const identifier = filename
    .replace(/^[^A-Z]*/gi, "")
    .replace(/[^A-Z0-9]*/gi, "");

  return identifier.length ? identifier : "DefaultName";
}
