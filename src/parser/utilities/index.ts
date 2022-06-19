import * as ts from "typescript";
import type { JSDoc } from "../types";

export { computeComponentName } from "./computeComponentName";
export { formatTag } from "./formatTag";
export { getDeclarations } from "./getDeclarations";
export { getDefaultExportForFile } from "./getDefaultExportForFile";
export { getParentType } from "./getParentType";
export { getPropertyName } from "./getPropertyName";
export { isInterfaceOrTypeAliasDeclaration } from "./isInterfaceOrTypeAliasDeclaration";
export {
  statementIsClassDeclaration,
  statementIsStatelessWithDefaultProps,
} from "./statements";

export function isOptional(prop: ts.Symbol) {
  return (prop.getFlags() & ts.SymbolFlags.Optional) !== 0;
}

export const defaultJSDoc: JSDoc = {
  description: "",
  fullComment: "",
  tags: {},
};

export const defaultCompilerOptions: ts.CompilerOptions = {
  jsx: ts.JsxEmit.React,
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.Latest,
};
