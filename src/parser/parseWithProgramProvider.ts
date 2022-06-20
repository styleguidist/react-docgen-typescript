import * as ts from "typescript";
import { Parser } from "./";
import type { ParserOptions } from "./";
import type { ComponentDoc } from "./types";

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
    .reduce<ComponentDoc[]>((docs, sourceFile) => {
      const moduleSymbol = checker.getSymbolAtLocation(sourceFile);

      if (!moduleSymbol) {
        return docs;
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

        if (!exp.exports) {
          return;
        }

        // Then document any static sub-components
        exp.exports.forEach((symbol) => {
          if (symbol.flags & ts.SymbolFlags.Prototype) {
            return;
          }

          if (symbol.flags & ts.SymbolFlags.Method) {
            const signature = parser.getCallSignature(symbol);
            const returnType = checker.typeToString(signature.getReturnType());

            if (returnType !== "Element") {
              return;
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
        });
      });

      return [...docs, ...componentDocs];
    }, [])
    .filter((comp, index, comps) =>
      comps
        .slice(index + 1)
        .every((innerComp) => innerComp.displayName !== comp.displayName)
    );
}
