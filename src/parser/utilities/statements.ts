import * as ts from "typescript";

export function statementIsClassDeclaration(
  statement: ts.Statement
): statement is ts.ClassDeclaration {
  return !!(statement as ts.ClassDeclaration).members;
}

export function statementIsStatelessWithDefaultProps(
  statement: ts.Statement
): boolean {
  const children = (statement as ts.ExpressionStatement).getChildren();
  for (const child of children) {
    const { left } = child as ts.BinaryExpression;
    if (left) {
      const { name } = left as ts.PropertyAccessExpression;
      if (name && name.escapedText === "defaultProps") {
        return true;
      }
    }
  }
  return false;
}
