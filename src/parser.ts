import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import { buildFilter } from './buildFilter';

import {
  Props,
  ParentType,
  PropItem,
  PropItemType,
  NumericEnumPropItem,
  StringEnumPropItem,
  UnionPropItem,
  HeterogeneousEnumPropItem
} from './PropItem';
export { Props, ParentType, PropItem, PropItemType };

// We'll use the currentDirectoryName to trim parent fileNames
const currentDirectoryPath = process.cwd();
const currentDirectoryParts = currentDirectoryPath.split(path.sep);
const currentDirectoryName =
  currentDirectoryParts[currentDirectoryParts.length - 1];
export interface StringIndexedObject<T> {
  [key: string]: T;
}

export interface ComponentDoc {
  displayName: string;
  description: string;
  props: Props;
  methods: Method[];
}

export interface Method {
  name: string;
  docblock: string;
  modifiers: string[];
  params: MethodParameter[];
  returns?: {
    description?: string | null;
    type?: string;
  } | null;
  description: string;
}

export interface MethodParameter {
  name: string;
  description?: string | null;
  type: MethodParameterType;
}

export interface MethodParameterType {
  name: string;
}

export interface Component {
  name: string;
}

export type PropFilter = (props: PropItem, component: Component) => boolean;

export type ComponentNameResolver = (
  exp: ts.Symbol,
  source: ts.SourceFile
) => string | undefined | null | false;

export interface ParserOptions {
  propFilter?: StaticPropFilter | PropFilter;
  componentNameResolver?: ComponentNameResolver;
  shouldRemoveUndefinedFromOptional?: boolean;
  maxValueFromObjectExtractionDepth?: number;
  savePropValueAsString?: boolean;
}

export interface StaticPropFilter {
  skipPropsWithName?: string[] | string;
  skipPropsWithoutDoc?: boolean;
}

export const defaultParserOpts: ParserOptions = {};

export interface FileParser {
  parse(filePathOrPaths: string | string[]): ComponentDoc[];
  parseWithProgramProvider(
    filePathOrPaths: string | string[],
    programProvider?: () => ts.Program
  ): ComponentDoc[];
}

export const defaultOptions: ts.CompilerOptions = {
  jsx: ts.JsxEmit.React,
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.Latest
};

/**
 * Parses a file with default TS options
 * @param filePath component file that should be parsed
 */
export function parse(
  filePathOrPaths: string | string[],
  parserOpts: ParserOptions = defaultParserOpts
) {
  return withCompilerOptions(defaultOptions, parserOpts).parse(filePathOrPaths);
}

/**
 * Constructs a parser for a default configuration.
 */
export function withDefaultConfig(
  parserOpts: ParserOptions = defaultParserOpts
): FileParser {
  return withCompilerOptions(defaultOptions, parserOpts);
}

/**
 * Constructs a parser for a specified tsconfig file.
 */
export function withCustomConfig(
  tsconfigPath: string,
  parserOpts: ParserOptions
): FileParser {
  const basePath = path.dirname(tsconfigPath);
  const { config, error } = ts.readConfigFile(tsconfigPath, filename =>
    fs.readFileSync(filename, 'utf8')
  );

  if (error !== undefined) {
    // tslint:disable-next-line: max-line-length
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
    throw errors[0];
  }

  return withCompilerOptions(options, parserOpts);
}

/**
 * Constructs a parser for a specified set of TS compiler options.
 */
export function withCompilerOptions(
  compilerOptions: ts.CompilerOptions,
  parserOpts: ParserOptions = defaultParserOpts
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
    }
  };
}

const isOptional = (prop: ts.Symbol) =>
  // tslint:disable-next-line:no-bitwise
  (prop.getFlags() & ts.SymbolFlags.Optional) !== 0;

interface JSDoc {
  description: string;
  fullComment: string;
  tags: StringIndexedObject<string>;
}

const defaultJSDoc: JSDoc = {
  description: '',
  fullComment: '',
  tags: {}
};

export class Parser {
  private checker: ts.TypeChecker;
  private propFilter: PropFilter;
  private shouldRemoveUndefinedFromOptional: boolean;
  private maxValueFromObjectExtractionDepth: number;
  private savePropValueAsString: boolean;

  constructor(program: ts.Program, opts: ParserOptions) {
    const {
      savePropValueAsString,
      shouldRemoveUndefinedFromOptional,
      maxValueFromObjectExtractionDepth = 8
    } = opts;
    this.checker = program.getTypeChecker();
    this.propFilter = buildFilter(opts);
    this.shouldRemoveUndefinedFromOptional = Boolean(
      shouldRemoveUndefinedFromOptional
    );
    this.maxValueFromObjectExtractionDepth = Number(
      maxValueFromObjectExtractionDepth
    );
    this.savePropValueAsString = Boolean(savePropValueAsString);
  }

  private getComponentFromExpression(exp: ts.Symbol) {
    const declaration = exp.valueDeclaration || exp.declarations![0];
    const type = this.checker.getTypeOfSymbolAtLocation(exp, declaration);
    const typeSymbol = type.symbol || type.aliasSymbol;

    if (!typeSymbol) {
      return exp;
    }

    const symbolName = typeSymbol.getName();

    if (
      (symbolName === 'MemoExoticComponent' ||
        symbolName === 'ForwardRefExoticComponent') &&
      exp.valueDeclaration &&
      ts.isExportAssignment(exp.valueDeclaration) &&
      ts.isCallExpression(exp.valueDeclaration.expression)
    ) {
      const component = this.checker.getSymbolAtLocation(
        exp.valueDeclaration.expression.arguments[0]
      );

      if (component) {
        exp = component;
      }
    }

    return exp;
  }

  public getComponentInfo(
    exp: ts.Symbol,
    source: ts.SourceFile,
    componentNameResolver: ComponentNameResolver = () => undefined
  ): ComponentDoc | null {
    if (!!exp.declarations && exp.declarations.length === 0) {
      return null;
    }

    let rootExp = this.getComponentFromExpression(exp);
    const declaration = rootExp.valueDeclaration || rootExp.declarations![0];
    const type = this.checker.getTypeOfSymbolAtLocation(rootExp, declaration);

    // The type Symbol from which props documentation should be resolved
    let commentSource = rootExp;
    /**
     * Root components type symbol
     */
    const typeSymbol = type.symbol || type.aliasSymbol;
    const originalName = rootExp.getName();

    if (!rootExp.valueDeclaration) {
      if (
        originalName === 'default' &&
        !typeSymbol &&
        (rootExp.flags & ts.SymbolFlags.Alias) !== 0
      ) {
        commentSource = this.checker.getAliasedSymbol(commentSource);
      } else if (!typeSymbol) {
        return null;
      } else {
        rootExp = typeSymbol;
        const expName = rootExp.getName();

        if (
          expName === '__function' ||
          expName === 'StatelessComponent' ||
          expName === 'Stateless' ||
          expName === 'StyledComponentClass' ||
          expName === 'StyledComponent' ||
          expName === 'FunctionComponent' ||
          expName === 'ForwardRefExoticComponent'
        ) {
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

    // Skip over PropTypes functions (from prop-types library) that are exported
    if (
      typeSymbol &&
      (typeSymbol.getEscapedName() === 'Requireable' ||
        typeSymbol.getEscapedName() === 'Validator')
    ) {
      return null;
    }

    const propsType =
      this.extractPropsFromTypeIfStatelessComponent(type) ||
      this.extractPropsFromTypeIfStatefulComponent(type);

    const nameSource = originalName === 'default' ? rootExp : commentSource;
    const resolvedComponentName = componentNameResolver(nameSource, source);
    const { description, tags } = this.findDocComment(commentSource);
    const displayName =
      resolvedComponentName ||
      tags.visibleName ||
      computeComponentName(nameSource, source);
    const methods = this.getMethodsInfo(type);

    if (propsType) {
      if (!commentSource.valueDeclaration) {
        return null;
      }
      const defaultProps = this.extractDefaultPropsFromComponent(
        commentSource,
        commentSource.valueDeclaration.getSourceFile()
      );
      const props = this.getPropsInfo(propsType, defaultProps);

      // Filters props from being returned in the ComponentDoc
      // - children when it does not have a description
      // - other props which do not pass a propFilter function
      //   that the parser has been called with.
      for (const propName of Object.keys(props)) {
        const prop = props[propName];
        const component: Component = { name: displayName };
        if (!this.propFilter(prop, component)) {
          delete props[propName];
        }
      }

      return {
        description,
        displayName,
        methods,
        props
      };
    } else if (description && displayName) {
      return {
        description,
        displayName,
        methods,
        props: {}
      };
    }

    return null;
  }

  public extractNestedValueFromObjectType(type: ts.Type): ts.Symbol | null {
    return null;
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
        if (propsParam.name === 'props' || params.length === 1) {
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
        const props = instanceType.getProperty('props');

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
    type.getProperties().forEach(property => {
      // Only add members, don't add non-member properties
      if (this.getCallSignature(property)) {
        methodSymbols.push(property);
      }
    });

    if (type.symbol && type.symbol.members) {
      type.symbol.members.forEach(member => {
        methodSymbols.push(member);
      });
    }

    return methodSymbols;
  }

  public getMethodsInfo(type: ts.Type): Method[] {
    const members = this.extractMembersFromType(type);
    const methods: Method[] = [];
    members.forEach(member => {
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
      const returnDescription = this.getReturnDescription(member);
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
              type: returnType
            }
          : null
      });
    });

    return methods;
  }

  public getModifiers(member: ts.Symbol) {
    const modifiers: string[] = [];
    const flags = ts.getCombinedModifierFlags(member.valueDeclaration);
    const isStatic = (flags & ts.ModifierFlags.Static) !== 0; // tslint:disable-line no-bitwise

    if (isStatic) {
      modifiers.push('static');
    }

    return modifiers;
  }

  public getParameterInfo(callSignature: ts.Signature): MethodParameter[] {
    return callSignature.parameters.map(param => {
      const paramType = this.checker.getTypeOfSymbolAtLocation(
        param,
        param.valueDeclaration
      );
      const paramDeclaration = this.checker.symbolToParameterDeclaration(param);
      const isOptionalParam: boolean = !!(
        paramDeclaration && paramDeclaration.questionToken
      );

      return {
        description:
          ts.displayPartsToString(
            param.getDocumentationComment(this.checker)
          ) || null,
        name: param.getName() + (isOptionalParam ? '?' : ''),
        type: { name: this.checker.typeToString(paramType) }
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
    const isPublic = Boolean(jsDocTags.find(tag => tag.name === 'public'));
    return isPublic;
  }

  public getReturnDescription(symbol: ts.Symbol) {
    const tags = symbol.getJsDocTags();
    const returnTag = tags.find(tag => tag.name === 'returns');
    if (!returnTag) {
      return null;
    }

    return returnTag.text || null;
  }

  public getDocgenType(
    jsDocComment: JSDoc | undefined,
    propSymbol: ts.Symbol,
    propType: ts.Type,
    isRequired: boolean,
    depth: number,
    debug: boolean
  ): PropItemType {
    let propTypeString = this.checker.typeToString(propType);

    if (jsDocComment && jsDocComment.tags.type) {
      return {
        name: jsDocComment.tags.type,
        raw: propTypeString,
        source: 'JSDoc type tag'
      };
    }

    if (propType.isUnion()) {
      const value: (EnumValue | UnionPropItem['type']['value'][number])[] = [];

      let isUnion = false;

      propType.types.forEach(type => {
        let typeString = this.checker.typeToString(type);

        if (type.isStringLiteral()) {
          value.push({
            value: `"${type.value}"`,
            raw: typeString,
            type: 'string'
          });
        } else if (type.isNumberLiteral()) {
          value.push({ value: type.value, raw: typeString, type: 'number' });
        } else if (typeString === 'false' || typeString === 'true') {
          value.push({
            value: typeString === 'true',
            raw: typeString,
            type: 'boolean'
          });
        } else if (typeString === 'undefined') {
          value.push({
            value: undefined,
            raw: typeString,
            type: 'undefined'
          });
        } else {
          isUnion = true;
          // until a strategy to avoid recursive types is implemented
          // going deeper here is likely to result in recursion.

          // const nestedValue: PropItemType = this.getDocgenType(
          //   undefined,
          //   type.symbol,
          //   type,
          //   false,
          //   depth + 1,
          //   debug
          // );
          value.push({ raw: typeString, type: 'other' });
        }
      });

      const unionOrEnumMembersType = isUnion
        ? 'union'
        : (value as EnumValue[]).reduce(
            (acc: EnumValue['type'] | 'heterogeneous' | undefined, current) => {
              if (acc === undefined) {
                return current.type;
              }
              if (current.type !== acc) {
                return 'heterogeneous';
              } else {
                return acc;
              }
            },
            undefined
          )!;

      if (unionOrEnumMembersType === 'union') {
        return {
          name: 'union' as const,
          raw: propTypeString,
          value: value as UnionPropItem['type']['value']
        };
      }

      if (unionOrEnumMembersType === 'boolean') {
        return {
          name: 'bool' as const,
          raw: propTypeString
        };
      }

      return {
        name: 'enum',
        raw: propTypeString,
        membersType: unionOrEnumMembersType,
        value: value as any
      };
    }

    function isArrayType(type: ts.Type): type is ts.TypeReference {
      return !!(
        (propType as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference
      );
    }

    if (isArrayType(propType)) {
      const values: PropItemType[] = [];

      if (depth > this.maxValueFromObjectExtractionDepth) {
        return {
          name: 'arrayOf',
          raw: propTypeString
        };
      }

      const typeArgs: readonly ts.Type[] =
        this.checker.getTypeArguments(propType) ?? [];

      if (typeArgs.length > 0) {
        typeArgs.forEach(typeArg => {
          const value: PropItemType = this.getDocgenType(
            undefined,
            typeArg.symbol,
            typeArg,
            false,
            depth + 1,
            debug
          );
          values.push(value);
        });
      }

      return {
        name: 'arrayOf',
        value: values,
        raw: propTypeString
      };
    }

    const members = propType.symbol && propType.symbol.members;
    // TODO: there's probably a bettter way to work out if the propType is a function,
    const isProbablyAFunction =
      propTypeString.startsWith('(') || propTypeString.startsWith('<');
    const isObjecty = !isProbablyAFunction && members !== undefined;

    if (isObjecty) {
      if (depth > this.maxValueFromObjectExtractionDepth) {
        return {
          name: 'shape',
          raw: propTypeString
        };
      }
      try {
        const nestedDocs = this.getDocsForANestedLayerOfProperties(
          propSymbol,
          propType,
          depth + 1,
          debug
        );

        return {
          name: 'shape',
          raw: propTypeString,
          value: nestedDocs
        };
      } catch (e) {
        throw e;
      }
    }

    if (this.shouldRemoveUndefinedFromOptional && !isRequired) {
      propTypeString = propTypeString.replace(' | undefined', '');
    }

    if (propType.isStringLiteral()) {
      return {
        name: `"${propType.value}"`,
        raw: propTypeString
      };
    }
    if (propType.isNumberLiteral()) {
      return { name: propType.value, raw: propTypeString };
    }

    return { name: propTypeString, raw: propTypeString };
  }

  public getLayerProperties(propsType: ts.Type) {
    const baseProps = propsType.getApparentProperties();
    // Props Properties (ie. keys)
    let propertiesOfProps = baseProps;

    if (propsType.isUnionOrIntersection()) {
      propertiesOfProps = [
        // Resolve extra properties in the union/intersection
        ...(propertiesOfProps = (this
          .checker as any).getAllPossiblePropertiesOfTypes(propsType.types)),
        // But props we already have override those as they are already correct.
        ...baseProps
      ];

      if (!propertiesOfProps.length) {
        const subTypes = (this.checker as any).getAllPossiblePropertiesOfTypes(
          propsType.types.reduce<ts.Symbol[]>(
            // @ts-ignore
            (all, t) => [...all, ...(t.types || [])],
            []
          )
        );

        propertiesOfProps = [...subTypes, ...baseProps];
      }
    }

    return { baseProps, propertiesOfProps };
  }

  public getDocsForANestedLayerOfProperties(
    sourceSymbol: ts.Symbol,
    propType: ts.Type,
    depth: number = 1,
    debug = false
  ) {
    // TODO it might make sense to have an enum for unions rather than merging like
    // is done for the root layer
    const { baseProps, propertiesOfProps } = this.getLayerProperties(propType);

    const result: Props = {};

    propertiesOfProps.forEach(propSymbol => {
      const propName = propSymbol.getName();

      // Find type of prop by looking in context of the props object itself.
      const propTypeFromSourceSymbol = this.checker.getTypeOfSymbolAtLocation(
        propSymbol,
        sourceSymbol.valueDeclaration!
      );

      const propTypeFromPropSymbol = this.checker.getTypeOfSymbolAtLocation(
        propSymbol,
        propSymbol.valueDeclaration!
      );

      const propType =
        this.checker.typeToString(propTypeFromSourceSymbol) === 'any'
          ? propTypeFromPropSymbol
          : propTypeFromSourceSymbol;

      const jsDocComment = this.findDocComment(propSymbol);

      const parent = getParentType(propSymbol);
      const declarations = propSymbol.declarations || [];
      const baseProp = baseProps.find(p => p.getName() === propName);

      const required =
        !isOptional(propSymbol) &&
        // If in a intersection or union check original declaration for "?"
        // @ts-ignore
        declarations.every(d => !d.questionToken) &&
        (!baseProp || !isOptional(baseProp));

      const type = this.getDocgenType(
        undefined,
        propSymbol,
        propType,
        false,
        depth,
        debug
      );

      const propItem = {
        defaultValue: undefined,
        description: jsDocComment.fullComment,
        name: propName,
        parent,
        required,
        type
        // casting to avoid issue with JSDocTypeTagPropItem colliding
        // with NonBasicOrLiteralPropItem and StringLiteralPropItem
      } as PropItem;

      result[propName] = propItem;
    });

    return result;
  }

  public getDocsForALayerOfProperties(
    sourceObjectTsSymbol: ts.Symbol,
    defaultProps: StringIndexedObject<string>,
    depth: number = 1,
    debug = false
  ) {
    const propsType = this.checker.getTypeOfSymbolAtLocation(
      sourceObjectTsSymbol,
      sourceObjectTsSymbol.valueDeclaration
    );
    const { baseProps, propertiesOfProps } = this.getLayerProperties(propsType);

    const result: Props = {};

    propertiesOfProps.forEach(propSymbol => {
      const propName = propSymbol.getName();

      // Find type of prop by looking in context of the props object itself.
      const propType = this.checker.getTypeOfSymbolAtLocation(
        propSymbol,
        sourceObjectTsSymbol.valueDeclaration!
      );

      const jsDocComment = this.findDocComment(propSymbol);
      const hasCodeBasedDefault = defaultProps[propName] !== undefined;

      let defaultValue: { value: any } | null = null;

      if (hasCodeBasedDefault) {
        defaultValue = { value: defaultProps[propName] };
      } else if (jsDocComment.tags.default) {
        defaultValue = { value: jsDocComment.tags.default };
      }

      const parent = getParentType(propSymbol);
      const declarations = propSymbol.declarations || [];
      const baseProp = baseProps.find(p => p.getName() === propName);

      const required =
        !isOptional(propSymbol) &&
        !hasCodeBasedDefault &&
        // If in a intersection or union check original declaration for "?"
        // @ts-ignore
        declarations.every(d => !d.questionToken) &&
        (!baseProp || !isOptional(baseProp));

      const type = this.getDocgenType(
        jsDocComment,
        propSymbol,
        propType,
        required,
        depth,
        debug
      );

      const propItem = {
        defaultValue,
        description: jsDocComment.fullComment,
        name: propName,
        parent,
        required,
        type
        // casting to avoid issue with JSDocTypeTagPropItem colliding
        // with NonBasicOrLiteralPropItem and StringLiteralPropItem
      } as PropItem;

      result[propName] = propItem;
    });

    return result;
  }

  public getPropsInfo(
    propsObj: ts.Symbol,
    defaultProps: StringIndexedObject<string> = {}
  ): Props {
    if (!propsObj.valueDeclaration) {
      return {};
    }
    const result = this.getDocsForALayerOfProperties(propsObj, defaultProps);

    return result;
  }

  public findDocComment(symbol: ts.Symbol): JSDoc {
    const comment = this.getFullJsDocComment(symbol);
    if (comment.fullComment || comment.tags.default) {
      return comment;
    }

    const rootSymbols = this.checker.getRootSymbols(symbol);
    const commentsOnRootSymbols = rootSymbols
      .filter(x => x !== symbol)
      .map(x => this.getFullJsDocComment(x))
      .filter(x => !!x.fullComment || !!comment.tags.default);

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
      mainComment = mainComment.replace('\r\n', '\n');
    }

    const tags = symbol.getJsDocTags() || [];

    const tagComments: string[] = [];
    const tagMap: StringIndexedObject<string> = {};

    tags.forEach(tag => {
      const trimmedText = (tag.text || '').trim();
      const currentValue = tagMap[tag.name];
      tagMap[tag.name] = currentValue
        ? currentValue + '\n' + trimmedText
        : trimmedText;

      if (['default', 'type'].indexOf(tag.name) < 0) {
        tagComments.push(formatTag(tag));
      }
    });

    return {
      description: mainComment,
      fullComment: (mainComment + '\n' + tagComments.join('\n')).trim(),
      tags: tagMap
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
        if (!symbol || symbol.getName() !== 'forwardRef') return;
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
    let possibleStatements = [
      ...source.statements
        // ensure that name property is available
        .filter(stmt => !!(stmt as ts.ClassDeclaration).name)
        .filter(
          stmt =>
            this.checker.getSymbolAtLocation(
              (stmt as ts.ClassDeclaration).name!
            ) === symbol
        ),
      ...source.statements.filter(
        stmt => ts.isExpressionStatement(stmt) || ts.isVariableStatement(stmt)
      )
    ];

    return possibleStatements.reduce((res, statement) => {
      if (statementIsClassDeclaration(statement) && statement.members.length) {
        const possibleDefaultProps = statement.members.filter(
          member =>
            member.name && getPropertyName(member.name) === 'defaultProps'
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
              initializer = (declarations[0] as ts.VariableDeclaration)
                .initializer;
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
          ...propMap
        };
      } else if (statementIsStatelessWithDefaultProps(statement)) {
        let propMap = {};
        (statement as ts.ExpressionStatement).getChildren().forEach(child => {
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
          ...propMap
        };
      } else {
      }

      const functionStatement = this.getFunctionStatement(statement);

      // Extracting default values from props destructuring
      if (functionStatement && functionStatement.parameters.length) {
        const { name } = functionStatement.parameters[0];

        if (ts.isObjectBindingPattern(name)) {
          return {
            ...res,
            ...this.getPropMap(name.elements)
          };
        }
      }

      return res;
    }, {});
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
        return this.savePropValueAsString ? 'false' : false;
      case ts.SyntaxKind.TrueKeyword:
        return this.savePropValueAsString ? 'true' : true;
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
        return this.savePropValueAsString ? 'null' : null;
      case ts.SyntaxKind.Identifier:
        // can potentially find other identifiers in the source and map those in the future
        return (initializer as ts.Identifier).text === 'undefined'
          ? 'undefined'
          : null;
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
        } catch (e) {
          return null;
        }
    }
  }

  public getPropMap(
    properties: ts.NodeArray<ts.PropertyAssignment | ts.BindingElement>
  ): StringIndexedObject<string | boolean | number | null> {
    const propMap = properties.reduce((acc, property) => {
      if (ts.isSpreadAssignment(property) || !property.name) {
        return acc;
      }

      const literalValue = this.getLiteralValueFromPropertyAssignment(property);
      const propertyName = getPropertyName(property.name);

      if (
        (typeof literalValue === 'string' ||
          typeof literalValue === 'number' ||
          typeof literalValue === 'boolean' ||
          literalValue === null) &&
        propertyName !== null
      ) {
        acc[propertyName] = literalValue;
      }

      return acc;
    }, {} as StringIndexedObject<string | boolean | number | null>);

    return propMap;
  }
}

type EnumValue =
  | NumericEnumPropItem['type']['value'][number]
  | StringEnumPropItem['type']['value'][number]
  | HeterogeneousEnumPropItem['type']['value'][number];

function isEnumValue(
  value: EnumValue | UnionPropItem['type']['value'][number]
): value is EnumValue {
  // @ts-ignore
  return value.type;
}

function statementIsClassDeclaration(
  statement: ts.Statement
): statement is ts.ClassDeclaration {
  return !!(statement as ts.ClassDeclaration).members;
}

function statementIsStatelessWithDefaultProps(
  statement: ts.Statement
): boolean {
  const children = (statement as ts.ExpressionStatement).getChildren();
  for (const child of children) {
    const { left } = child as ts.BinaryExpression;
    if (left) {
      const { name } = left as ts.PropertyAccessExpression;
      if (name && name.escapedText === 'defaultProps') {
        return true;
      }
    }
  }
  return false;
}

function getPropertyName(
  name: ts.PropertyName | ts.BindingPattern
): string | null {
  switch (name.kind) {
    case ts.SyntaxKind.NumericLiteral:
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.Identifier:
      return name.text;
    case ts.SyntaxKind.ComputedPropertyName:
      return name.getText();
    default:
      return null;
  }
}

function formatTag(tag: ts.JSDocTagInfo) {
  let result = '@' + tag.name;
  if (tag.text) {
    result += ' ' + tag.text;
  }
  return result;
}

function getTextValueOfClassMember(
  classDeclaration: ts.ClassDeclaration,
  memberName: string
): string {
  const classDeclarationMembers = classDeclaration.members || [];
  const [textValue] =
    classDeclarationMembers &&
    classDeclarationMembers
      .filter(member => ts.isPropertyDeclaration(member))
      .filter(member => {
        const name = ts.getNameOfDeclaration(member) as ts.Identifier;
        return name && name.text === memberName;
      })
      .map(member => {
        const property = member as ts.PropertyDeclaration;
        return (
          property.initializer && (property.initializer as ts.Identifier).text
        );
      });

  return textValue || '';
}

function getTextValueOfFunctionProperty(
  exp: ts.Symbol,
  source: ts.SourceFile,
  propertyName: string
) {
  const [textValue] = source.statements
    .filter(statement => ts.isExpressionStatement(statement))
    .filter(statement => {
      const expr = (statement as ts.ExpressionStatement)
        .expression as ts.BinaryExpression;
      return (
        expr.left &&
        (expr.left as ts.PropertyAccessExpression).name &&
        (expr.left as ts.PropertyAccessExpression).name.escapedText ===
          propertyName
      );
    })
    .filter(statement => {
      const expr = (statement as ts.ExpressionStatement)
        .expression as ts.BinaryExpression;

      return (
        ((expr.left as ts.PropertyAccessExpression).expression as ts.Identifier)
          .escapedText === exp.getName()
      );
    })
    .filter(statement => {
      return ts.isStringLiteral(
        ((statement as ts.ExpressionStatement)
          .expression as ts.BinaryExpression).right
      );
    })
    .map(statement => {
      return (((statement as ts.ExpressionStatement)
        .expression as ts.BinaryExpression).right as ts.Identifier).text;
    });

  return textValue || '';
}

function computeComponentName(exp: ts.Symbol, source: ts.SourceFile) {
  const exportName = exp.getName();

  const statelessDisplayName = getTextValueOfFunctionProperty(
    exp,
    source,
    'displayName'
  );

  const statefulDisplayName =
    exp.valueDeclaration &&
    ts.isClassDeclaration(exp.valueDeclaration) &&
    getTextValueOfClassMember(exp.valueDeclaration, 'displayName');

  if (statelessDisplayName || statefulDisplayName) {
    return statelessDisplayName || statefulDisplayName || '';
  }

  if (
    exportName === 'default' ||
    exportName === '__function' ||
    exportName === 'Stateless' ||
    exportName === 'StyledComponentClass' ||
    exportName === 'StyledComponent' ||
    exportName === 'FunctionComponent' ||
    exportName === 'StatelessComponent' ||
    exportName === 'ForwardRefExoticComponent'
  ) {
    return getDefaultExportForFile(source);
  } else {
    return exportName;
  }
}

// Default export for a file: named after file
export function getDefaultExportForFile(source: ts.SourceFile) {
  const name = path.basename(source.fileName, path.extname(source.fileName));
  const filename =
    name === 'index' ? path.basename(path.dirname(source.fileName)) : name;

  // JS identifiers must starts with a letter, and contain letters and/or numbers
  // So, you could not take filename as is
  const identifier = filename
    .replace(/^[^A-Z]*/gi, '')
    .replace(/[^A-Z0-9]*/gi, '');

  return identifier.length ? identifier : 'DefaultName';
}

function hasName<T extends ts.Node & { name: any }>(
  parent: ts.Node
): parent is T {
  // @ts-ignore
  return parent.name !== undefined;
}

function getParentType(propertySymbol: ts.Symbol): ParentType | undefined {
  const declarations = propertySymbol.getDeclarations();

  if (declarations == null || declarations.length === 0) {
    return undefined;
  }

  // Props can be declared only in one place
  const { parent } = declarations[0];

  if (!hasName(parent)) {
    return undefined;
  }

  const parentName = parent.name.text;
  const { fileName } = parent.getSourceFile();

  const fileNameParts = fileName.split('/');
  const trimmedFileNameParts = fileNameParts.slice();

  while (trimmedFileNameParts.length) {
    if (trimmedFileNameParts[0] === currentDirectoryName) {
      break;
    }
    trimmedFileNameParts.splice(0, 1);
  }
  let trimmedFileName;
  if (trimmedFileNameParts.length) {
    trimmedFileName = trimmedFileNameParts.join('/');
  } else {
    trimmedFileName = fileName;
  }

  return {
    fileName: trimmedFileName,
    name: parentName
  };
}

function parseWithProgramProvider(
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
    .map(filePath => program.getSourceFile(filePath))
    .filter(
      (sourceFile): sourceFile is ts.SourceFile =>
        typeof sourceFile !== 'undefined'
    )
    .reduce<ComponentDoc[]>((docs, sourceFile) => {
      const moduleSymbol = checker.getSymbolAtLocation(sourceFile);

      if (!moduleSymbol) {
        return docs;
      }

      const components = checker.getExportsOfModule(moduleSymbol);
      const componentDocs: ComponentDoc[] = [];

      // First document all components
      components.forEach(exp => {
        const doc = parser.getComponentInfo(
          exp,
          sourceFile,
          parserOpts.componentNameResolver
        );

        if (doc) {
          componentDocs.push(doc);
        }

        if (!exp.exports) {
          return;
        }

        // Then document any static sub-components
        exp.exports.forEach(symbol => {
          if (symbol.flags & ts.SymbolFlags.Prototype) {
            return;
          }

          if (symbol.flags & ts.SymbolFlags.Method) {
            const signature = parser.getCallSignature(symbol);
            const returnType = checker.typeToString(signature.getReturnType());

            if (returnType !== 'Element') {
              return;
            }
          }

          const doc = parser.getComponentInfo(
            symbol,
            sourceFile,
            parserOpts.componentNameResolver
          );

          if (doc) {
            componentDocs.push({
              ...doc,
              displayName: `${exp.escapedName}.${symbol.escapedName}`
            });
          }
        });
      });

      // Remove any duplicates (for HOC where the names are the same)
      const componentDocsNoDuplicates = componentDocs.reduce(
        (prevVal, comp) => {
          const duplicate = prevVal.find(compDoc => {
            return compDoc!.displayName === comp!.displayName;
          });
          if (duplicate) return prevVal;
          return [...prevVal, comp];
        },
        [] as ComponentDoc[]
      );

      const filteredComponentDocs = componentDocsNoDuplicates.filter(
        (comp, index, comps) =>
          comps
            .slice(index + 1)
            .every(innerComp => innerComp!.displayName !== comp!.displayName)
      );

      return [...docs, ...filteredComponentDocs];
    }, []);
}
