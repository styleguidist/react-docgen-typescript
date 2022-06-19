import * as ts from "typescript";
import { trimFileName } from "../../trimFileName";
import { isInterfaceOrTypeAliasDeclaration } from "./isInterfaceOrTypeAliasDeclaration";

export interface ParentType {
  name: string;
  fileName: string;
}

export function getParentType(prop: ts.Symbol): ParentType | undefined {
  const declarations = prop.getDeclarations();

  if (declarations == null || declarations.length === 0) {
    return undefined;
  }

  // Props can be declared only in one place
  const { parent } = declarations[0];

  if (!isInterfaceOrTypeAliasDeclaration(parent)) {
    return undefined;
  }

  const parentName = parent.name.text;
  const { fileName } = parent.getSourceFile();

  return {
    fileName: trimFileName(fileName),
    name: parentName,
  };
}
