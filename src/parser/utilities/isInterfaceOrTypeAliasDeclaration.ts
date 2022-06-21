import * as ts from "typescript";

export type InterfaceOrTypeAliasDeclaration =
  | ts.TypeAliasDeclaration
  | ts.InterfaceDeclaration;

export function isInterfaceOrTypeAliasDeclaration(
  node: ts.Node
): node is InterfaceOrTypeAliasDeclaration {
  return (
    node.kind === ts.SyntaxKind.InterfaceDeclaration ||
    node.kind === ts.SyntaxKind.TypeAliasDeclaration
  );
}
