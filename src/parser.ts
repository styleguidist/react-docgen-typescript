import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import { buildFilter } from './buildFilter';

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

export interface Props extends StringIndexedObject<PropItem> {}

export interface PropItem {
  name: string;
  required: boolean;
  type: PropItemType;
  description: string;
  defaultValue: any;
  parent?: ParentType;
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

export interface PropItemType {
  name: string;
  value?: any;
  raw?: string;
}

export interface ParentType {
  name: string;
  fileName: string;
}

export type PropFilter = (props: PropItem, component: Component) => boolean;

export type ComponentNameResolver = (
  exp: ts.Symbol,
  source: ts.SourceFile
) => string | undefined | null | false;

export interface ParserOptions {
  propFilter?: StaticPropFilter | PropFilter;
  componentNameResolver?: ComponentNameResolver;
  shouldExtractLiteralValuesFromEnum?: boolean;
  shouldRemoveUndefinedFromOptional?: boolean;
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

const defaultOptions: ts.CompilerOptions = {
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
    const errorText = `Cannot load custom tsconfig.json from provided path: ${tsconfigPath}, with error code: ${
      error.code
    }, message: ${error.messageText}`;
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
  private shouldExtractLiteralValuesFromEnum: boolean;
  private savePropValueAsString: boolean;

  constructor(program: ts.Program, opts: ParserOptions) {
    const {
      savePropValueAsString,
      shouldExtractLiteralValuesFromEnum,
      shouldRemoveUndefinedFromOptional
    } = opts;
    this.checker = program.getTypeChecker();
    this.propFilter = buildFilter(opts);
    this.shouldExtractLiteralValuesFromEnum = Boolean(
      shouldExtractLiteralValuesFromEnum
    );
    this.shouldRemoveUndefinedFromOptional = Boolean(
      shouldRemoveUndefinedFromOptional
    );
    this.savePropValueAsString = Boolean(savePropValueAsString);
  }

  public getComponentInfo(
    exp: ts.Symbol,
    source: ts.SourceFile,
    componentNameResolver: ComponentNameResolver = () => undefined
  ): ComponentDoc | null {
    if (!!exp.declarations && exp.declarations.length === 0) {
      return null;
    }

    const type = this.checker.getTypeOfSymbolAtLocation(
      exp,
      exp.valueDeclaration || exp.declarations![0]
    );
    let commentSource = exp;
    const typeSymbol = type.symbol || type.aliasSymbol;
    const originalName = exp.getName();

    if (!exp.valueDeclaration) {
      if (
        originalName === 'default' &&
        !typeSymbol &&
        (exp.flags & ts.SymbolFlags.Alias) !== 0
      ) {
        commentSource = this.checker.getAliasedSymbol(commentSource);
      } else if (!typeSymbol) {
        return null;
      } else {
        exp = typeSymbol;
        const expName = exp.getName();

        if (
          expName === '__function' ||
          expName === 'StatelessComponent' ||
          expName === 'Stateless' ||
          expName === 'StyledComponentClass' ||
          expName === 'StyledComponent' ||
          expName === 'FunctionComponent'
        ) {
          commentSource = this.checker.getAliasedSymbol(commentSource);
        } else {
          commentSource = exp;
        }
      }
    }

    // Skip over PropTypes that are exported
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

    const nameSource = originalName === 'default' ? exp : commentSource;
    const resolvedComponentName = componentNameResolver(nameSource, source);
    const displayName =
      resolvedComponentName || computeComponentName(nameSource, source);
    const description = this.findDocComment(commentSource).fullComment;
    const methods = this.getMethodsInfo(type);

    if (propsType) {
      const defaultProps = this.extractDefaultPropsFromComponent(exp, source);
      const props = this.getPropsInfo(propsType, defaultProps);

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

  public getDocgenType(propType: ts.Type, isRequired: boolean): PropItemType {
    let propTypeString = this.checker.typeToString(propType);

    if (
      this.shouldExtractLiteralValuesFromEnum &&
      propType.isUnion() &&
      propType.types.every(type => type.isStringLiteral())
    ) {
      return {
        name: 'enum',
        raw: propTypeString,
        value: propType.types
          .map(type => ({
            value: type.isStringLiteral() ? `"${type.value}"` : undefined
          }))
          .filter(Boolean)
      };
    }

    if (this.shouldRemoveUndefinedFromOptional && !isRequired) {
      propTypeString = propTypeString.replace(' | undefined', '');
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
    const baseProps = propsType.getProperties();
    const propertiesOfProps: ts.Symbol[] = propsType.isUnionOrIntersection()
      ? // Using internal typescript API to get all properties
        (this.checker as any).getAllPossiblePropertiesOfTypes(propsType.types)
      : baseProps;

    const result: Props = {};

    propertiesOfProps.forEach(prop => {
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
      const declarations = prop.declarations || [];
      const baseProp = baseProps.find(p => p.getName() === propName);

      const required =
        !isOptional(prop) &&
        !hasCodeBasedDefault &&
        // If in a intersection or union check original declaration for "?"
        // @ts-ignore
        declarations.every(d => !d.questionToken) &&
        (!baseProp || !isOptional(baseProp));

      result[propName] = {
        defaultValue,
        description: jsDocComment.fullComment,
        name: propName,
        parent,
        required,
        type: this.getDocgenType(propType, required)
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

      if (tag.name !== 'default') {
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
      const initializer =
        statement.declarationList &&
        statement.declarationList.declarations[0].initializer;

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
          propMap = this.getPropMap(properties as ts.NodeArray<
            ts.PropertyAssignment
          >);
        }

        return {
          ...res,
          ...propMap
        };
      } else if (statementIsStatelessWithDefaultProps(statement)) {
        let propMap = {};
        (statement as ts.ExpressionStatement).getChildren().forEach(child => {
          const { right } = child as ts.BinaryExpression;
          if (right) {
            const { properties } = right as ts.ObjectLiteralExpression;
            if (properties) {
              propMap = this.getPropMap(properties as ts.NodeArray<
                ts.PropertyAssignment
              >);
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
      case ts.SyntaxKind.PropertyAccessExpression:
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
    const propMap = properties.reduce(
      (acc, property) => {
        if (ts.isSpreadAssignment(property) || !property.name) {
          return acc;
        }

        const literalValue = this.getLiteralValueFromPropertyAssignment(
          property
        );
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
      },
      {} as StringIndexedObject<string | boolean | number | null>
    );

    return propMap;
  }
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
    exportName === 'StatelessComponent'
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

function getParentType(prop: ts.Symbol): ParentType | undefined {
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

function isInterfaceOrTypeAliasDeclaration(
  node: ts.Node
): node is ts.InterfaceDeclaration | ts.TypeAliasDeclaration {
  return (
    node.kind === ts.SyntaxKind.InterfaceDeclaration ||
    node.kind === ts.SyntaxKind.TypeAliasDeclaration
  );
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

      Array.prototype.push.apply(
        docs,
        checker
          .getExportsOfModule(moduleSymbol)
          .map(exp =>
            parser.getComponentInfo(
              exp,
              sourceFile,
              parserOpts.componentNameResolver
            )
          )
          .filter((comp): comp is ComponentDoc => comp !== null)
          .filter((comp, index, comps) =>
            comps
              .slice(index + 1)
              .every(innerComp => innerComp!.displayName !== comp!.displayName)
          )
      );

      return docs;
    }, []);
}
