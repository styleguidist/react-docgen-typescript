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

export function iterateSymbolTable<T>(
  symTable: ts.SymbolTable,
  iterator: (sym: ts.Symbol) => T | null
): T[] {
  const result: (T | null)[] = [];
  symTable.forEach((sym) => result.push(iterator(sym)));
  return result.filter(nonNull);
}

export function nonNull<T>(value: T): value is NonNullable<T> {
  return value != null;
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
