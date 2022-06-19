import * as ts from "typescript";
import type { ParserOptions } from "../";
import { getDefaultExportForFile } from "./getDefaultExportForFile";

export function computeComponentName(
  exp: ts.Symbol,
  source: ts.SourceFile,
  customComponentTypes: ParserOptions["customComponentTypes"] = []
) {
  const exportName = exp.getName();

  const statelessDisplayName = getTextValueOfFunctionProperty(
    exp,
    source,
    "displayName"
  );

  const statefulDisplayName =
    exp.valueDeclaration &&
    ts.isClassDeclaration(exp.valueDeclaration) &&
    getTextValueOfClassMember(exp.valueDeclaration, "displayName");

  if (statelessDisplayName || statefulDisplayName) {
    return statelessDisplayName || statefulDisplayName || "";
  }

  const defaultComponentTypes = [
    "default",
    "__function",
    "Stateless",
    "StyledComponentClass",
    "StyledComponent",
    "FunctionComponent",
    "StatelessComponent",
    "ForwardRefExoticComponent",
    "MemoExoticComponent",
  ];

  const supportedComponentTypes = [
    ...defaultComponentTypes,
    ...customComponentTypes,
  ];

  if (supportedComponentTypes.indexOf(exportName) !== -1) {
    return getDefaultExportForFile(source);
  } else {
    return exportName;
  }
}

function getTextValueOfClassMember(
  classDeclaration: ts.ClassDeclaration,
  memberName: string
): string {
  const classDeclarationMembers = classDeclaration.members || [];
  const [textValue] =
    classDeclarationMembers &&
    classDeclarationMembers
      .filter((member) => ts.isPropertyDeclaration(member))
      .filter((member) => {
        const name = ts.getNameOfDeclaration(member) as ts.Identifier;
        return name && name.text === memberName;
      })
      .map((member) => {
        const property = member as ts.PropertyDeclaration;
        return (
          property.initializer && (property.initializer as ts.Identifier).text
        );
      });

  return textValue || "";
}

function getTextValueOfFunctionProperty(
  exp: ts.Symbol,
  source: ts.SourceFile,
  propertyName: string
) {
  const [textValue] = source.statements
    .filter((statement) => ts.isExpressionStatement(statement))
    .filter((statement) => {
      const expr = (statement as ts.ExpressionStatement)
        .expression as ts.BinaryExpression;
      return (
        expr.left &&
        (expr.left as ts.PropertyAccessExpression).name &&
        (expr.left as ts.PropertyAccessExpression).name.escapedText ===
          propertyName
      );
    })
    .filter((statement) => {
      return ts.isStringLiteral(
        (
          (statement as ts.ExpressionStatement)
            .expression as ts.BinaryExpression
        ).right
      );
    })
    .map((statement) => {
      return (
        (
          (statement as ts.ExpressionStatement)
            .expression as ts.BinaryExpression
        ).right as ts.Identifier
      ).text;
    });

  return textValue || "";
}
