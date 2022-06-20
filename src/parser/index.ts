import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

import { buildFilter } from "../buildFilter";
import {
  computeComponentName,
  defaultCompilerOptions,
  defaultJSDoc,
  formatTag,
  getDeclarations,
  getParentType,
  getPropertyName,
  isOptional,
  statementIsClassDeclaration,
  statementIsStatelessWithDefaultProps,
} from "./utilities";
import { parseWithProgramProvider } from "./parseWithProgramProvider";
import type {
  Component,
  ComponentDoc,
  ComponentNameResolver,
  FileParser,
  JSDoc,
  Method,
  MethodParameter,
  PropFilter,
  PropItemType,
  Props,
  StaticPropFilter,
  StringIndexedObject,
} from "./types";

export interface ParserOptions {
  propFilter?: StaticPropFilter | PropFilter;
  componentNameResolver?: ComponentNameResolver;
  shouldExtractLiteralValuesFromEnum?: boolean;
  shouldRemoveUndefinedFromOptional?: boolean;
  shouldExtractValuesFromUnion?: boolean;
  skipChildrenPropWithoutDoc?: boolean;
  savePropValueAsString?: boolean;
  shouldIncludePropTagMap?: boolean;
  shouldIncludeExpression?: boolean;
  customComponentTypes?: string[];
}

export function parse(
  filePathOrPaths: string | string[],
  parserOpts: ParserOptions = {}
) {
  return withCompilerOptions(defaultCompilerOptions, parserOpts).parse(
    filePathOrPaths
  );
}

/**
 * Constructs a parser for a default configuration.
 */
export function withDefaultConfig(parserOpts: ParserOptions = {}): FileParser {
  return withCompilerOptions(defaultCompilerOptions, parserOpts);
}

/**
 * Constructs a parser for a specified tsconfig file.
 */
export function withCustomConfig(
  tsconfigPath: string,
  parserOpts: ParserOptions
): FileParser {
  const basePath = path.dirname(tsconfigPath);
  const { config, error } = ts.readConfigFile(tsconfigPath, (filename) =>
    fs.readFileSync(filename, "utf8")
  );

  if (error !== undefined) {
    const errorText = `Cannot load custom tsconfig.json from provided path: ${tsconfigPath}, with error code: ${error.code}, message: ${error.messageText}`;
    throw new Error(errorText);
  }

  const { options, errors } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    basePath,
    {},
    tsconfigPath
  );

  if (errors && errors.length) {
    if (errors[0] instanceof Error) {
      throw errors[0];
    } else if (errors[0].messageText) {
      throw new Error(`TS${errors[0].code}: ${errors[0].messageText}`);
    } else {
      throw new Error(JSON.stringify(errors[0]));
    }
  }

  return withCompilerOptions(options, parserOpts);
}

/**
 * Constructs a parser for a specified set of TS compiler options.
 */
export function withCompilerOptions(
  compilerOptions: ts.CompilerOptions,
  parserOpts: ParserOptions = {}
): FileParser {
  return {
    parse(filePathOrPaths: string | string[]): ComponentDoc[] {
      return parseWithProgramProvider(
        filePathOrPaths,
        compilerOptions,
        parserOpts
      );
    },
    parseWithProgramProvider(filePathOrPaths, programProvider) {
      return parseWithProgramProvider(
        filePathOrPaths,
        compilerOptions,
        parserOpts,
        programProvider
      );
    },
  };
}

export class Parser {
  private readonly checker: ts.TypeChecker;
  private readonly propFilter: PropFilter;
  private readonly shouldRemoveUndefinedFromOptional: boolean;
  private readonly shouldExtractLiteralValuesFromEnum: boolean;
  private readonly shouldExtractValuesFromUnion: boolean;
  private readonly savePropValueAsString: boolean;
  private readonly shouldIncludePropTagMap: boolean;
  private readonly shouldIncludeExpression: boolean;

  constructor(program: ts.Program, opts: ParserOptions) {
    const {
      savePropValueAsString,
      shouldExtractLiteralValuesFromEnum,
      shouldRemoveUndefinedFromOptional,
      shouldExtractValuesFromUnion,
      shouldIncludePropTagMap,
      shouldIncludeExpression,
    } = opts;
    this.checker = program.getTypeChecker();
    this.propFilter = buildFilter(opts);
    this.shouldExtractLiteralValuesFromEnum = Boolean(
      shouldExtractLiteralValuesFromEnum
    );
    this.shouldRemoveUndefinedFromOptional = Boolean(
      shouldRemoveUndefinedFromOptional
    );
    this.shouldExtractValuesFromUnion = Boolean(shouldExtractValuesFromUnion);
    this.savePropValueAsString = Boolean(savePropValueAsString);
    this.shouldIncludePropTagMap = Boolean(shouldIncludePropTagMap);
    this.shouldIncludeExpression = Boolean(shouldIncludeExpression);
  }

  private getComponentFromExpression(exp: ts.Symbol): ts.Symbol {
    const declaration = exp.valueDeclaration || exp.declarations![0];
    const type = this.checker.getTypeOfSymbolAtLocation(exp, declaration);
    const typeSymbol = type.symbol || type.aliasSymbol;

    if (!typeSymbol) {
      return exp;
    }

    const symbolName = typeSymbol.getName();

    if (
      (symbolName === "MemoExoticComponent" ||
        symbolName === "ForwardRefExoticComponent") &&
      exp.valueDeclaration &&
      ts.isExportAssignment(exp.valueDeclaration) &&
      ts.isCallExpression(exp.valueDeclaration.expression)
    ) {
      const component = this.checker.getSymbolAtLocation(
        exp.valueDeclaration.expression.arguments[0]
      );

      if (component) {
        return component;
      }
    }

    return exp;
  }

  public getComponentInfo(
    exp: ts.Symbol,
    source: ts.SourceFile,
    componentNameResolver: ComponentNameResolver = () => undefined,
    customComponentTypes: ParserOptions["customComponentTypes"] = []
  ): ComponentDoc | null {
    if (!!exp.declarations && exp.declarations.length === 0) {
      return null;
    }

    let rootExp = this.getComponentFromExpression(exp);
    const declaration = rootExp.valueDeclaration || rootExp.declarations![0];
    const type = this.checker.getTypeOfSymbolAtLocation(rootExp, declaration);

    let commentSource = rootExp;
    const typeSymbol = type.symbol || type.aliasSymbol;
    const originalName = rootExp.getName();
    const filePath = source.fileName;

    if (!rootExp.valueDeclaration) {
      if (!typeSymbol && (rootExp.flags & ts.SymbolFlags.Alias) !== 0) {
        commentSource = this.checker.getAliasedSymbol(commentSource);
      } else if (!typeSymbol) {
        return null;
      } else {
        rootExp = typeSymbol;
        const expName = rootExp.getName();

        const defaultComponentTypes = [
          "__function",
          "StatelessComponent",
          "Stateless",
          "StyledComponentClass",
          "StyledComponent",
          "FunctionComponent",
          "ForwardRefExoticComponent",
          "MemoExoticComponent",
        ];

        const supportedComponentTypes = [
          ...defaultComponentTypes,
          ...customComponentTypes,
        ];

        if (supportedComponentTypes.indexOf(expName) !== -1) {
          commentSource = this.checker.getAliasedSymbol(commentSource);
        } else {
          commentSource = rootExp;
        }
      }
    } else if (
      type.symbol &&
      (ts.isPropertyAccessExpression(declaration) ||
        ts.isPropertyDeclaration(declaration))
    ) {
      commentSource = type.symbol;
    }

    // Skip over PropTypes that are exported
    if (
      typeSymbol &&
      (typeSymbol.getEscapedName() === "Requireable" ||
        typeSymbol.getEscapedName() === "Validator")
    ) {
      return null;
    }

    const propsType =
      this.extractPropsFromTypeIfStatelessComponent(type) ||
      this.extractPropsFromTypeIfStatefulComponent(type);

    const nameSource = originalName === "default" ? rootExp : commentSource;
    const resolvedComponentName = componentNameResolver(nameSource, source);
    const { description, tags } = this.findDocComment(commentSource);
    const displayName =
      resolvedComponentName ||
      tags.visibleName ||
      computeComponentName(nameSource, source, customComponentTypes);
    const methods = this.getMethodsInfo(type);

    let result: ComponentDoc | null = null;
    if (propsType) {
      if (!commentSource.valueDeclaration) {
        return null;
      }
      const defaultProps = this.extractDefaultPropsFromComponent(
        commentSource,
        commentSource.valueDeclaration.getSourceFile()
      );
      const props = this.getPropsInfo(propsType, defaultProps);

      for (const propName of Object.keys(props)) {
        const prop = props[propName];
        const component: Component = { name: displayName };
        if (!this.propFilter(prop, component)) {
          delete props[propName];
        }
      }
      result = {
        tags,
        filePath,
        description,
        displayName,
        methods,
        props,
      };
    } else if (description && displayName) {
      // there aren't props, but, we can get plain function information
      let funInfo = {};
      if (ts.isFunctionDeclaration(declaration)) {
        funInfo = {
          returns: declaration.type?.getText(),
          params: declaration.parameters.map(
            (sym: ts.ParameterDeclaration) => ({
              name: sym.name?.escapedText,
              description: ts
                .getJSDocTags(sym)
                .map((tag) => tag.comment)
                .join(""),
              type: sym?.type?.getText(),
            })
          ),
        };
      }

      result = {
        tags,
        filePath,
        description,
        displayName,
        methods,
        props: {},
        ...funInfo,
      };
    }

    if (result !== null && this.shouldIncludeExpression) {
      result.expression = rootExp;
    }

    return result;
  }

  public extractPropsFromTypeIfStatelessComponent(
    type: ts.Type
  ): ts.Symbol | null {
    const callSignatures = type.getCallSignatures();

    if (callSignatures.length) {
      // Could be a stateless component.  Is a function, so the props object we're interested
      // in is the (only) parameter.

      for (const sig of callSignatures) {
        const params = sig.getParameters();
        if (params.length === 0) {
          continue;
        }
        // Maybe we could check return type instead,
        // but not sure if Element, ReactElement<T> are all possible values
        const propsParam = params[0];
        if (propsParam.name === "props" || params.length === 1) {
          return propsParam;
        }
      }
    }

    return null;
  }

  public extractPropsFromTypeIfStatefulComponent(
    type: ts.Type
  ): ts.Symbol | null {
    const constructSignatures = type.getConstructSignatures();

    if (constructSignatures.length) {
      // React.Component. Is a class, so the props object we're interested
      // in is the type of 'props' property of the object constructed by the class.

      for (const sig of constructSignatures) {
        const instanceType = sig.getReturnType();
        const props = instanceType.getProperty("props");

        if (props) {
          return props;
        }
      }
    }

    return null;
  }

  public extractMembersFromType(type: ts.Type): ts.Symbol[] {
    const methodSymbols: ts.Symbol[] = [];

    /**
     * Need to loop over properties first so we capture any
     * static methods. static methods aren't captured in type.symbol.members
     */
    type.getProperties().forEach((property) => {
      // Only add members, don't add non-member properties
      if (this.getCallSignature(property)) {
        methodSymbols.push(property);
      }
    });

    if (type.symbol && type.symbol.members) {
      type.symbol.members.forEach((member) => {
        methodSymbols.push(member);
      });
    }

    return methodSymbols;
  }

  public getMethodsInfo(type: ts.Type): Method[] {
    const members = this.extractMembersFromType(type);
    const methods: Method[] = [];
    members.forEach((member) => {
      if (!this.isTaggedPublic(member)) {
        return;
      }

      const name = member.getName();
      const docblock = this.getFullJsDocComment(member).fullComment;
      const callSignature = this.getCallSignature(member);
      const params = this.getParameterInfo(callSignature);
      const description = ts.displayPartsToString(
        member.getDocumentationComment(this.checker)
      );
      const returnType = this.checker.typeToString(
        callSignature.getReturnType()
      );
      const returnDescription = ts.displayPartsToString(
        this.getReturnDescription(member)
      );
      const modifiers = this.getModifiers(member);

      methods.push({
        description,
        docblock,
        modifiers,
        name,
        params,
        returns: returnDescription
          ? {
              description: returnDescription,
              type: returnType,
            }
          : null,
      });
    });

    return methods;
  }

  public getModifiers(member: ts.Symbol) {
    const modifiers: string[] = [];
    if (!member.valueDeclaration) {
      return modifiers;
    }

    const flags = ts.getCombinedModifierFlags(member.valueDeclaration);
    const isStatic = (flags & ts.ModifierFlags.Static) !== 0;

    if (isStatic) {
      modifiers.push("static");
    }

    return modifiers;
  }

  public getParameterInfo(callSignature: ts.Signature): MethodParameter[] {
    return callSignature.parameters.map((param) => {
      const paramType = this.checker.getTypeOfSymbolAtLocation(
        param,
        param.valueDeclaration!
      );
      const paramDeclaration = this.checker.symbolToParameterDeclaration(
        param,
        undefined,
        undefined
      );
      const isOptionalParam = !!(
        paramDeclaration && paramDeclaration.questionToken
      );

      return {
        description:
          ts.displayPartsToString(
            param.getDocumentationComment(this.checker)
          ) || null,
        name: param.getName() + (isOptionalParam ? "?" : ""),
        type: { name: this.checker.typeToString(paramType) },
      };
    });
  }

  public getCallSignature(symbol: ts.Symbol) {
    const symbolType = this.checker.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration!
    );

    return symbolType.getCallSignatures()[0];
  }

  public isTaggedPublic(symbol: ts.Symbol) {
    const jsDocTags = symbol.getJsDocTags();
    return Boolean(jsDocTags.find((tag) => tag.name === "public"));
  }

  public getReturnDescription(
    symbol: ts.Symbol
  ): ts.SymbolDisplayPart[] | undefined {
    const tags = symbol.getJsDocTags();
    const returnTag = tags.find((tag) => tag.name === "returns");
    if (!returnTag || !Array.isArray(returnTag.text)) {
      return;
    }

    return returnTag.text;
  }

  private getValuesFromUnionType(type: ts.Type): string | number {
    if (type.isStringLiteral()) return `"${type.value}"`;
    if (type.isNumberLiteral()) return `${type.value}`;
    return this.checker.typeToString(type);
  }

  private getInfoFromUnionType(type: ts.Type): {
    value: string | number;
  } & Partial<JSDoc> {
    let commentInfo = {};
    if (type.getSymbol()) {
      commentInfo = { ...this.getFullJsDocComment(type.getSymbol()!) };
    }
    return {
      value: this.getValuesFromUnionType(type),
      ...commentInfo,
    };
  }

  public getDocgenType(propType: ts.Type, isRequired: boolean): PropItemType {
    // When we are going to process the type, we check if this type has a constraint (is a generic type with constraint)
    if (propType.getConstraint()) {
      // If so, we assing the property the type that is the constraint
      propType = propType.getConstraint()!;
    }

    let propTypeString = this.checker.typeToString(propType);
    if (this.shouldRemoveUndefinedFromOptional && !isRequired) {
      propTypeString = propTypeString.replace(" | undefined", "");
    }

    if (propType.isUnion()) {
      if (
        this.shouldExtractValuesFromUnion ||
        (this.shouldExtractLiteralValuesFromEnum &&
          propType.types.every(
            (type) =>
              type.getFlags() &
              (ts.TypeFlags.StringLiteral |
                ts.TypeFlags.NumberLiteral |
                ts.TypeFlags.EnumLiteral |
                ts.TypeFlags.Undefined)
          ))
      ) {
        let value = propType.types.map((type) =>
          this.getInfoFromUnionType(type)
        );

        if (this.shouldRemoveUndefinedFromOptional && !isRequired) {
          value = value.filter((option) => option.value != "undefined");
        }

        return {
          name: "enum",
          raw: propTypeString,
          value,
        };
      }
    }

    if (this.shouldRemoveUndefinedFromOptional && !isRequired) {
      propTypeString = propTypeString.replace(" | undefined", "");
    }

    return { name: propTypeString };
  }

  public getPropsInfo(
    propsObj: ts.Symbol,
    defaultProps: StringIndexedObject<string> = {}
  ): Props {
    if (!propsObj.valueDeclaration) {
      return {};
    }

    const propsType = this.checker.getTypeOfSymbolAtLocation(
      propsObj,
      propsObj.valueDeclaration
    );
    const baseProps = propsType.getApparentProperties();
    let propertiesOfProps = baseProps;

    if (propsType.isUnionOrIntersection()) {
      propertiesOfProps = [
        // Resolve extra properties in the union/intersection
        ...(propertiesOfProps = (
          this.checker as any
        ).getAllPossiblePropertiesOfTypes(propsType.types)),
        // But props we already have override those as they are already correct.
        ...baseProps,
      ];

      if (!propertiesOfProps.length) {
        const subTypes = (this.checker as any).getAllPossiblePropertiesOfTypes(
          propsType.types.reduce<ts.Symbol[]>(
            (all: ts.Symbol[], t) => [...all, ...((t as any).types || [])],
            []
          )
        );

        propertiesOfProps = [...subTypes, ...baseProps];
      }
    }

    const result: Props = {};

    propertiesOfProps.forEach((prop) => {
      const propName = prop.getName();

      // Find type of prop by looking in context of the props object itself.
      const propType = this.checker.getTypeOfSymbolAtLocation(
        prop,
        propsObj.valueDeclaration!
      );

      const jsDocComment = this.findDocComment(prop);
      const hasCodeBasedDefault = defaultProps[propName] !== undefined;

      let defaultValue: { value: any } | null = null;

      if (hasCodeBasedDefault) {
        defaultValue = { value: defaultProps[propName] };
      } else if (jsDocComment.tags.default) {
        defaultValue = { value: jsDocComment.tags.default };
      }

      const parent = getParentType(prop);
      const parents = getDeclarations(prop);
      const declarations: (ts.Declaration & { questionToken?: unknown })[] =
        prop.declarations || [];
      const baseProp = baseProps.find((p) => p.getName() === propName);

      const required =
        !isOptional(prop) &&
        !hasCodeBasedDefault &&
        // If in a intersection or union check original declaration for "?"
        declarations.every((d) => !d.questionToken) &&
        (!baseProp || !isOptional(baseProp));

      const type = jsDocComment.tags.type
        ? {
            name: jsDocComment.tags.type,
          }
        : this.getDocgenType(propType, required);

      const propTags = this.shouldIncludePropTagMap
        ? { tags: jsDocComment.tags }
        : {};
      const description = this.shouldIncludePropTagMap
        ? jsDocComment.description.replace(/\r\n/g, "\n")
        : jsDocComment.fullComment.replace(/\r\n/g, "\n");

      result[propName] = {
        defaultValue,
        description: description,
        name: propName,
        parent,
        declarations: parents,
        required,
        type,
        ...propTags,
      };
    });

    return result;
  }

  public findDocComment(symbol: ts.Symbol): JSDoc {
    const comment = this.getFullJsDocComment(symbol);
    if (comment.fullComment || comment.tags.default) {
      return comment;
    }

    const rootSymbols = this.checker.getRootSymbols(symbol);
    const commentsOnRootSymbols = rootSymbols
      .filter((x) => x !== symbol)
      .map((x) => this.getFullJsDocComment(x))
      .filter((x) => !!x.fullComment || !!comment.tags.default);

    if (commentsOnRootSymbols.length) {
      return commentsOnRootSymbols[0];
    }

    return defaultJSDoc;
  }

  /**
   * Extracts a full JsDoc comment from a symbol, even
   * though TypeScript has broken down the JsDoc comment into plain
   * text and JsDoc tags.
   */
  public getFullJsDocComment(symbol: ts.Symbol): JSDoc {
    // in some cases this can be undefined (Pick<Type, 'prop1'|'prop2'>)
    if (symbol.getDocumentationComment === undefined) {
      return defaultJSDoc;
    }

    let mainComment = ts.displayPartsToString(
      symbol.getDocumentationComment(this.checker)
    );

    if (mainComment) {
      mainComment = mainComment.replace(/\r\n/g, "\n");
    }

    const tags = symbol.getJsDocTags() || [];

    const tagComments: string[] = [];
    const tagMap: StringIndexedObject<string> = {};

    tags.forEach((tag) => {
      const trimmedText = ts.displayPartsToString(tag.text).trim();
      const currentValue = tagMap[tag.name];
      tagMap[tag.name] = currentValue
        ? currentValue + "\n" + trimmedText
        : trimmedText;

      if (["default", "type"].indexOf(tag.name) < 0) {
        tagComments.push(formatTag(tag));
      }
    });

    return {
      description: mainComment,
      fullComment: (mainComment + "\n" + tagComments.join("\n")).trim(),
      tags: tagMap,
    };
  }

  getFunctionStatement(statement: ts.Statement) {
    if (ts.isFunctionDeclaration(statement)) {
      return statement;
    }

    if (ts.isVariableStatement(statement)) {
      let initializer =
        statement.declarationList &&
        statement.declarationList.declarations[0].initializer;

      // Look at forwardRef function argument
      if (initializer && ts.isCallExpression(initializer)) {
        const symbol = this.checker.getSymbolAtLocation(initializer.expression);
        if (!symbol || symbol.getName() !== "forwardRef") return;
        initializer = initializer.arguments[0];
      }

      if (
        initializer &&
        (ts.isArrowFunction(initializer) ||
          ts.isFunctionExpression(initializer))
      ) {
        return initializer;
      }
    }
  }

  public extractDefaultPropsFromComponent(
    symbol: ts.Symbol,
    source: ts.SourceFile
  ) {
    const possibleStatements = [
      ...source.statements
        // ensure that name property is available
        .filter((stmt) => !!(stmt as ts.ClassDeclaration).name)
        .filter(
          (stmt) =>
            this.checker.getSymbolAtLocation(
              (stmt as ts.ClassDeclaration).name!
            ) === symbol
        ),
      ...source.statements.filter(
        (stmt) => ts.isExpressionStatement(stmt) || ts.isVariableStatement(stmt)
      ),
    ];

    return possibleStatements.reduce((res, statement) => {
      if (statementIsClassDeclaration(statement) && statement.members.length) {
        const possibleDefaultProps = statement.members.filter(
          (member) =>
            member.name && getPropertyName(member.name) === "defaultProps"
        );

        if (!possibleDefaultProps.length) {
          return res;
        }

        const defaultProps = possibleDefaultProps[0];
        let initializer = (defaultProps as ts.PropertyDeclaration).initializer;
        if (!initializer) {
          return res;
        }
        let properties = (initializer as ts.ObjectLiteralExpression).properties;

        while (ts.isIdentifier(initializer as ts.Identifier)) {
          const defaultPropsReference = this.checker.getSymbolAtLocation(
            initializer as ts.Node
          );
          if (defaultPropsReference) {
            const declarations = defaultPropsReference.getDeclarations();

            if (declarations) {
              if (ts.isImportSpecifier(declarations[0])) {
                const symbol = this.checker.getSymbolAtLocation(
                  declarations[0].name
                );
                if (!symbol) {
                  continue;
                }
                const aliasedSymbol = this.checker.getAliasedSymbol(symbol);
                if (
                  aliasedSymbol &&
                  aliasedSymbol.declarations &&
                  aliasedSymbol.declarations.length
                ) {
                  initializer = (
                    aliasedSymbol.declarations[0] as ts.VariableDeclaration
                  ).initializer;
                } else {
                  continue;
                }
              } else {
                initializer = (declarations[0] as ts.VariableDeclaration)
                  .initializer;
              }
              properties = (initializer as ts.ObjectLiteralExpression)
                .properties;
            }
          }
        }

        let propMap = {};

        if (properties) {
          propMap = this.getPropMap(
            properties as ts.NodeArray<ts.PropertyAssignment>
          );
        }

        return {
          ...res,
          ...propMap,
        };
      } else if (statementIsStatelessWithDefaultProps(statement)) {
        let propMap = {};
        (statement as ts.ExpressionStatement).getChildren().forEach((child) => {
          let { right } = child as ts.BinaryExpression;

          if (right && ts.isIdentifier(right)) {
            const value = ((source as any).locals as ts.SymbolTable).get(
              right.escapedText
            );

            if (
              value &&
              value.valueDeclaration &&
              ts.isVariableDeclaration(value.valueDeclaration) &&
              value.valueDeclaration.initializer
            ) {
              right = value.valueDeclaration.initializer;
            }
          }

          if (right) {
            const { properties } = right as ts.ObjectLiteralExpression;
            if (properties) {
              propMap = this.getPropMap(
                properties as ts.NodeArray<ts.PropertyAssignment>
              );
            }
          }
        });
        return {
          ...res,
          ...propMap,
        };
      }
      const functionStatement = this.getFunctionStatement(statement);

      // Extracting default values from props destructuring
      if (
        functionStatement &&
        functionStatement.parameters &&
        functionStatement.parameters.length
      ) {
        const { name } = functionStatement.parameters[0];

        if (ts.isObjectBindingPattern(name)) {
          return {
            ...res,
            ...this.getPropMap(name.elements),
          };
        }
      }

      return res;
    }, {});
  }

  public getLiteralValueFromImportSpecifier(
    property: ts.ImportSpecifier
  ): string | boolean | number | null | undefined {
    if (ts.isImportSpecifier(property)) {
      const symbol = this.checker.getSymbolAtLocation(property.name);

      if (!symbol) {
        return null;
      }

      const aliasedSymbol = this.checker.getAliasedSymbol(symbol);
      if (
        aliasedSymbol &&
        aliasedSymbol.declarations &&
        aliasedSymbol.declarations.length
      ) {
        return this.getLiteralValueFromPropertyAssignment(
          aliasedSymbol.declarations[0] as ts.BindingElement
        );
      }

      return null;
    }

    return null;
  }

  public getLiteralValueFromPropertyAssignment(
    property: ts.PropertyAssignment | ts.BindingElement
  ): string | boolean | number | null | undefined {
    let { initializer } = property;

    // Shorthand properties, so inflect their actual value
    if (!initializer) {
      if (ts.isShorthandPropertyAssignment(property)) {
        const symbol = this.checker.getShorthandAssignmentValueSymbol(property);
        const decl =
          symbol && (symbol.valueDeclaration as ts.VariableDeclaration);

        if (decl && decl.initializer) {
          initializer = decl.initializer!;
        }
      }
    }

    if (!initializer) {
      return undefined;
    }

    // Literal values
    switch (initializer.kind) {
      case ts.SyntaxKind.FalseKeyword:
        return this.savePropValueAsString ? "false" : false;
      case ts.SyntaxKind.TrueKeyword:
        return this.savePropValueAsString ? "true" : true;
      case ts.SyntaxKind.StringLiteral:
        return (initializer as ts.StringLiteral).text.trim();
      case ts.SyntaxKind.PrefixUnaryExpression:
        return this.savePropValueAsString
          ? initializer.getFullText().trim()
          : Number((initializer as ts.PrefixUnaryExpression).getFullText());
      case ts.SyntaxKind.NumericLiteral:
        return this.savePropValueAsString
          ? `${(initializer as ts.NumericLiteral).text}`
          : Number((initializer as ts.NumericLiteral).text);
      case ts.SyntaxKind.NullKeyword:
        return this.savePropValueAsString ? "null" : null;
      case ts.SyntaxKind.Identifier:
        if ((initializer as ts.Identifier).text === "undefined") {
          return "undefined";
        }
        // eslint-disable-next-line no-case-declarations
        const symbol = this.checker.getSymbolAtLocation(
          initializer as ts.Identifier
        );

        if (symbol && symbol.declarations && symbol.declarations.length) {
          if (ts.isImportSpecifier(symbol.declarations[0])) {
            return this.getLiteralValueFromImportSpecifier(
              symbol.declarations[0] as ts.ImportSpecifier
            );
          }

          return this.getLiteralValueFromPropertyAssignment(
            symbol.declarations[0] as ts.BindingElement
          );
        }

        return null;
      case ts.SyntaxKind.PropertyAccessExpression: {
        const symbol = this.checker.getSymbolAtLocation(
          initializer as ts.PropertyAccessExpression
        );

        if (symbol && symbol.declarations && symbol.declarations.length) {
          const declaration = symbol.declarations[0];

          if (
            ts.isBindingElement(declaration) ||
            ts.isPropertyAssignment(declaration)
          ) {
            return this.getLiteralValueFromPropertyAssignment(declaration);
          }
        }
      }
      case ts.SyntaxKind.ObjectLiteralExpression:
      default:
        try {
          return initializer.getText();
        } catch {
          return null;
        }
    }
  }

  public getPropMap(
    properties: ts.NodeArray<ts.PropertyAssignment | ts.BindingElement>
  ): StringIndexedObject<string | boolean | number | null> {
    return properties.reduce((acc, property) => {
      if (ts.isSpreadAssignment(property) || !property.name) {
        return acc;
      }

      const literalValue = this.getLiteralValueFromPropertyAssignment(property);
      const propertyName = getPropertyName(property.name);

      if (
        (typeof literalValue === "string" ||
          typeof literalValue === "number" ||
          typeof literalValue === "boolean" ||
          literalValue === null) &&
        propertyName !== null
      ) {
        acc[propertyName] = literalValue;
      }

      return acc;
    }, {} as StringIndexedObject<string | boolean | number | null>);
  }
}
