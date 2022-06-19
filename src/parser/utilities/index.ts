import * as ts from "typescript";

export * from "./computeComponentName";
export * from "./formatTag";
export * from "./getDeclarations";
export * from "./getDefaultExportForFile";
export { getParentType } from "./getParentType";
export * from "./getPropertyName";
export * from "./isInterfaceOrTypeAliasDeclaration";
export * from "./statements";

export function isOptional(prop: ts.Symbol) {
  return (prop.getFlags() & ts.SymbolFlags.Optional) !== 0;
}
