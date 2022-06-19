import * as ts from "typescript";

export type InterfaceOrTypeAliasDeclaration =
  | ts.TypeAliasDeclaration
  | ts.InterfaceDeclaration;

export function isInterfaceOrTypeAliasDeclaration(
  node: ts.Node
): node is ts.InterfaceDeclaration | ts.TypeAliasDeclaration {
  return (
    node.kind === ts.SyntaxKind.InterfaceDeclaration ||
    node.kind === ts.SyntaxKind.TypeAliasDeclaration
  );
}
