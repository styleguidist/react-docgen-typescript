import * as ts from "typescript";
import { trimFileName } from "../../trimFileName";
import { isInterfaceOrTypeAliasDeclaration } from "./isInterfaceOrTypeAliasDeclaration";
import type { ParentType } from "./getParentType";

export function getDeclarations(prop: ts.Symbol): ParentType[] | undefined {
  const declarations = prop.getDeclarations();

  if (declarations === undefined || declarations.length === 0) {
    return undefined;
  }

  const parents: ParentType[] = [];

  for (const { parent } of declarations) {
    if (!isTypeLiteral(parent) && !isInterfaceOrTypeAliasDeclaration(parent)) {
      continue;
    }

    const { fileName } = parent.getSourceFile();

    parents.push({
      fileName: trimFileName(fileName),
      name: "name" in parent ? parent.name.text : "TypeLiteral",
    });
  }

  return parents;
}

function isTypeLiteral(node: ts.Node): node is ts.TypeLiteralNode {
  return node.kind === ts.SyntaxKind.TypeLiteral;
}
