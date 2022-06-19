import * as ts from "typescript";

export function formatTag(tag: ts.JSDocTagInfo) {
  let result = "@" + tag.name;
  if (tag.text) {
    result += " " + ts.displayPartsToString(tag.text);
  }
  return result;
}
