import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import { buildFilter } from './buildFilter';

export interface StringIndexedObject<T> {
  [key: string]: T;
}

export interface ComponentDoc {
  displayName: string;
  description: string;
  props: Props;
}

export interface Props extends StringIndexedObject<PropItem> {}

export interface PropItem {
  name: string;
  required: boolean;
  type: PropItemType;
  description: string;
  defaultValue: any;
}

export interface Component {
  name: string;
}

export interface PropItemType {
  name: string;
  value?: any;
}

export type PropFilter = (props: PropItem, component: Component) => boolean;

export interface ParserOptions {
  propFilter?: StaticPropFilter | PropFilter;
}

export interface StaticPropFilter {
  skipPropsWithName?: string[] | string;
  skipPropsWithoutDoc?: boolean;
}

export const defaultParserOpts: ParserOptions = {};

export interface FileParser {
  parse(filePath: string): ComponentDoc[];
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
  filePath: string,
  parserOpts: ParserOptions = defaultParserOpts
) {
  return withCompilerOptions(defaultOptions, parserOpts).parse(filePath);
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
    throw error;
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
    parse(filePath: string): ComponentDoc[] {
      const program = ts.createProgram([filePath], compilerOptions);

      const parser = new Parser(program, parserOpts);

      const checker = program.getTypeChecker();
      const sourceFile = program.getSourceFile(filePath);

      if (!sourceFile) {
        return [];
      }

      const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
      if (!moduleSymbol) {
        return [];
      }
      const exports = checker.getExportsOfModule(moduleSymbol);

      const components = exports
        .map(exp => parser.getComponentInfo(exp, sourceFile))
        .filter(comp => comp);

      // this should filter out components with the same name as default export
      const filteredComponents = components
        // ensure that component exists
        .filter(comp => !!comp)
        .filter((comp, index) => {
          const isUnique =
            components
              // ensure that comp exists
              .filter(cmp => !!cmp)
              .slice(index + 1)
              // it has been checked, that comp and innerComp are not null, so access is safe
              .filter(innerComp => innerComp!.displayName === comp!.displayName)
              .length === 0;
          return isUnique;
        });

      return filteredComponents as ComponentDoc[];
    }
  };
}

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

class Parser {
  private checker: ts.TypeChecker;
  private propFilter: PropFilter;

  constructor(program: ts.Program, opts: ParserOptions) {
    this.checker = program.getTypeChecker();
    this.propFilter = buildFilter(opts);
  }

  public getComponentInfo(
    exp: ts.Symbol,
    source: ts.SourceFile
  ): ComponentDoc | null {
    if (!!exp.declarations && exp.declarations.length === 0) {
      return null;
    }
    const type = this.checker.getTypeOfSymbolAtLocation(
      exp,
      exp.valueDeclaration || exp.declarations![0]
    );
    let commentSource = exp;
    if (!exp.valueDeclaration) {
      if (!type.symbol) {
        return null;
      }
      exp = type.symbol;
      if (exp.getName() === 'StatelessComponent') {
        commentSource = this.checker.getAliasedSymbol(commentSource);
      } else {
        commentSource = exp;
      }
    }

    const propsType =
      this.extractPropsFromTypeIfStatelessComponent(type) ||
      this.extractPropsFromTypeIfStatefulComponent(type);

    if (propsType) {
      const componentName = computeComponentName(exp, source);
      const defaultProps = this.extractDefaultPropsFromComponent(exp, source);
      const props = this.getPropsInfo(propsType, defaultProps);

      for (const propName of Object.keys(props)) {
        const prop = props[propName];
        const component: Component = { name: componentName };
        if (!this.propFilter(prop, component)) {
          delete props[propName];
        }
      }

      return {
        description: this.findDocComment(commentSource).fullComment,
        displayName: componentName,
        props
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
    const propertiesOfProps = propsType.getProperties();

    const result: Props = {};

    propertiesOfProps.forEach(prop => {
      const propName = prop.getName();

      // Find type of prop by looking in context of the props object itself.
      const propType = this.checker.getTypeOfSymbolAtLocation(
        prop,
        propsObj.valueDeclaration!
      );

      const propTypeString = this.checker.typeToString(propType);

      // tslint:disable-next-line:no-bitwise
      const isOptional = (prop.getFlags() & ts.SymbolFlags.Optional) !== 0;

      const jsDocComment = this.findDocComment(prop);

      let defaultValue = null;

      if (defaultProps[propName] !== undefined) {
        defaultValue = { value: defaultProps[propName] };
      } else if (jsDocComment.tags.default) {
        defaultValue = { value: jsDocComment.tags.default };
      }

      result[propName] = {
        defaultValue,
        description: jsDocComment.fullComment,
        name: propName,
        required: !isOptional,
        type: { name: propTypeString }
      };
    });

    return result;
  }

  public findDocComment(symbol: ts.Symbol): JSDoc {
    const comment = this.getFullJsDocComment(symbol);
    if (comment.fullComment) {
      return comment;
    }

    const rootSymbols = this.checker.getRootSymbols(symbol);
    const commentsOnRootSymbols = rootSymbols
      .filter(x => x !== symbol)
      .map(x => this.getFullJsDocComment(x))
      .filter(x => !!x.fullComment);

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

    const mainComment = ts.displayPartsToString(
      symbol.getDocumentationComment()
    );

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

  public extractDefaultPropsFromComponent(
    symbol: ts.Symbol,
    source: ts.SourceFile
  ) {
    let possibleStatements = source.statements
      // ensure that name property is available
      .filter(stmt => !!(stmt as ts.ClassDeclaration).name)
      .filter(
        stmt =>
          this.checker.getSymbolAtLocation(
            (stmt as ts.ClassDeclaration).name!
          ) === symbol
      );

    if (!possibleStatements.length) {
      // if no class declaration is found, try to find a
      // expression statement used in a React.StatelessComponent
      possibleStatements = source.statements.filter(stmt =>
        ts.isExpressionStatement(stmt)
      );
    }

    if (!possibleStatements.length) {
      return {};
    }

    const statement = possibleStatements[0];

    if (statementIsClassDeclaration(statement) && statement.members.length) {
      const possibleDefaultProps = statement.members.filter(
        member => member.name && getPropertyName(member.name) === 'defaultProps'
      );

      if (!possibleDefaultProps.length) {
        return {};
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
            properties = (initializer as ts.ObjectLiteralExpression).properties;
          }
        }
      }

      let propMap = {};

      if (properties) {
        propMap = getPropMap(properties as ts.NodeArray<ts.PropertyAssignment>);
      }

      return propMap;
    } else if (statementIsStateless(statement)) {
      let propMap = {};
      (statement as ts.ExpressionStatement).getChildren().forEach(child => {
        const { right } = child as ts.BinaryExpression;
        if (right) {
          const { properties } = right as ts.ObjectLiteralExpression;
          if (properties) {
            propMap = getPropMap(properties as ts.NodeArray<
              ts.PropertyAssignment
            >);
          }
        }
      });
      return propMap;
    }
    return {};
  }
}

function statementIsClassDeclaration(
  statement: ts.Statement
): statement is ts.ClassDeclaration {
  return !!(statement as ts.ClassDeclaration).members;
}

function statementIsStateless(statement: ts.Statement): boolean {
  const children = (statement as ts.ExpressionStatement).getChildren();
  for (const child of children) {
    const { left } = child as ts.BinaryExpression;
    if (left) {
      const { name } = left as ts.PropertyAccessExpression;
      if (name.escapedText === 'defaultProps') {
        return true;
      }
    }
  }
  return false;
}

function getPropMap(
  properties: ts.NodeArray<ts.PropertyAssignment>
): StringIndexedObject<string> {
  const propMap = properties.reduce(
    (acc, property) => {
      const literalValue = getLiteralValueFromPropertyAssignment(property);
      const propertyName = getPropertyName(property.name);
      if (typeof literalValue === 'string' && propertyName !== null) {
        const value = getLiteralValueFromPropertyAssignment(property);
        if (value !== null) {
          acc[propertyName] = value;
        }
      }
      return acc;
    },
    {} as StringIndexedObject<string>
  );
  return propMap;
}

function getPropertyName(name: ts.PropertyName): string | null {
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

function getLiteralValueFromPropertyAssignment(
  property: ts.PropertyAssignment
): string | null {
  const { initializer } = property;
  switch (initializer.kind) {
    case ts.SyntaxKind.FalseKeyword:
      return 'false';
    case ts.SyntaxKind.TrueKeyword:
      return 'true';
    case ts.SyntaxKind.StringLiteral:
      return (initializer as ts.StringLiteral).text.trim();
    case ts.SyntaxKind.PrefixUnaryExpression:
      return initializer.getFullText().trim();
    case ts.SyntaxKind.NumericLiteral:
      return `${(initializer as ts.NumericLiteral).text}`;
    case ts.SyntaxKind.NullKeyword:
      return 'null';
    case ts.SyntaxKind.Identifier:
      // can potentially find other identifiers in the source and map those in the future
      return (initializer as ts.Identifier).text === 'undefined'
        ? 'undefined'
        : null;
    case ts.SyntaxKind.ObjectLiteralExpression:
      // return the source text for an object literal
      return (initializer as ts.ObjectLiteralExpression).getText();
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
  const [textValue] = classDeclaration.members
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
    exportName === 'StatelessComponent'
  ) {
    // Default export for a file: named after file
    const name = path.basename(source.fileName, path.extname(source.fileName));

    return name === 'index'
      ? path.basename(path.dirname(source.fileName))
      : name;
  } else {
    return exportName;
  }
}
