import * as ts from "typescript";
import type { ParserOptions } from "./";
import { Parser } from "./";
import type { ComponentDoc } from "./types";
import { iterateSymbolTable } from "./utilities";

export function parseWithProgramProvider(
  filePathOrPaths: string | string[],
  compilerOptions: ts.CompilerOptions,
  parserOpts: ParserOptions,
  programProvider?: () => ts.Program
): ComponentDoc[] {
  const filePaths = Array.isArray(filePathOrPaths)
    ? filePathOrPaths
    : [filePathOrPaths];

  const program = programProvider
    ? programProvider()
    : ts.createProgram(filePaths, compilerOptions);

  const parser = new Parser(program, parserOpts);

  const checker = program.getTypeChecker();

  return filePaths
    .map((filePath) => program.getSourceFile(filePath))
    .filter(
      (sourceFile): sourceFile is ts.SourceFile =>
        typeof sourceFile !== "undefined"
    )
    .reduce<ComponentDoc[]>((acc, sourceFile) => {
      const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
      if (!moduleSymbol) {
        return acc;
      }

      const components = checker.getExportsOfModule(moduleSymbol);
      const componentDocs: ComponentDoc[] = [];

      // First document all components
      components.forEach((exp) => {
        const doc = parser.getComponentInfo(
          exp,
          sourceFile,
          parserOpts.componentNameResolver,
          parserOpts.customComponentTypes
        );

        if (doc) {
          componentDocs.push(doc);
        }

        // Then document any static sub-components
        iterateSymbolTable<ComponentDoc>(exp.exports, (symbol) => {
          if (symbol.flags & ts.SymbolFlags.Prototype) {
            return null;
          }

          if (symbol.flags & ts.SymbolFlags.Method) {
            const signature = parser.getCallSignature(symbol);
            const returnType = checker.typeToString(signature.getReturnType());

            if (returnType !== "Element") {
              return null;
            }
          }

          const doc = parser.getComponentInfo(
            symbol,
            sourceFile,
            parserOpts.componentNameResolver,
            parserOpts.customComponentTypes
          );

          if (doc) {
            const prefix =
              exp.escapedName === "default" ? "" : `${exp.escapedName}.`;

            componentDocs.push({
              ...doc,
              displayName: `${prefix}${symbol.escapedName}`,
            });
          }

          return null;
        });
      });

      return [...acc, ...componentDocs];
    }, [])
    .filter((comp, index, comps) =>
      comps
        .slice(index + 1)
        .every((innerComp) => innerComp.displayName !== comp.displayName)
    );
}
