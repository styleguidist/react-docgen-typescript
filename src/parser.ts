import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

export interface StringIndexedObject<T> {
    [key: string]: T;
}

export interface ComponentDoc {
    displayName: string;
    description: string;
    props: Props;
}

export interface Props extends StringIndexedObject<PropItem> { }

export interface PropItem {
    required: boolean;
    type: PropItemType;
    description: string;
    defaultValue: any;
}

export interface PropItemType {
    name: string;
    value?: any;
}

export interface FileParser {
    parse(filePath: string): ComponentDoc[];
}

const defaultOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.React,
};

/**
 * Parses a file with default TS options
 * @param filePath component file that should be parsed
 */
export function parse(filePath: string) {
    return withCompilerOptions(defaultOptions).parse(filePath);
}

/**
 * Constructs a parser for a default configuration.
 */
export function withDefaultConfig(): FileParser {
    return withCompilerOptions(defaultOptions);
}

/**
 * Constructs a parser for a specified tsconfig file.
 */
export function withCustomConfig(tsconfigPath: string): FileParser {
    const configJson = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    const basePath = path.dirname(tsconfigPath);

    const { options, errors } = ts.convertCompilerOptionsFromJson(
        configJson.compilerOptions, basePath, tsconfigPath
    );

    if (errors && errors.length) {
        throw errors[0];
    }

    return withCompilerOptions(options);
}

/**
 * Constructs a parser for a specified set of TS compiler options.
 */
export function withCompilerOptions(compilerOptions: ts.CompilerOptions): FileParser {
    return {
        parse(filePath: string): ComponentDoc[] {
            const program = ts.createProgram([filePath], compilerOptions);

            const parser = new Parser(program);

            const checker = program.getTypeChecker();
            const sourceFile = program.getSourceFile(filePath);

            const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
            const exports = checker.getExportsOfModule(moduleSymbol);

            const components = exports
                .map(exp => parser.getComponentInfo(exp, sourceFile))
                .filter(comp => comp);

            // this should filter out components with the same name as default export
            const filteredComponents = components    
                .filter((comp, index) => {
                    const isUnique = components
                        .slice(index + 1)
                        .filter(i => i.displayName === comp.displayName)
                        .length === 0;
                    return isUnique;
                });

            return filteredComponents;
        }
    };
}

interface JSDoc {
    description: string;
    fullComment: string;
    tags: StringIndexedObject<string>;
}

const defaultJSDoc: JSDoc = {
    fullComment: '',
    tags: {},
    description: ''
};

class Parser {
    private checker: ts.TypeChecker;

    constructor(program: ts.Program) {
        this.checker = program.getTypeChecker();
    }

    public getComponentInfo(exp: ts.Symbol, source: ts.SourceFile): ComponentDoc {
        const type = this.checker.getTypeOfSymbolAtLocation(exp, exp.valueDeclaration || exp.declarations[0]);
        if (!exp.valueDeclaration) {
            exp = type.symbol;
        }

        let propsType = this.extractPropsFromTypeIfStatelessComponent(type);
        if (!propsType) {
            propsType = this.extractPropsFromTypeIfStatefulComponent(type);
        }

        if (propsType) {
            const componentName = computeComponentName(exp, source);
            const defaultProps = this.extractDefaultPropsFromComponent(exp, source);
            const props = this.getPropsInfo(propsType, defaultProps);

            return {
                displayName: componentName,
                description: this.findDocComment(exp).fullComment,
                props: props
            };
        }

        return null;
    }

    public extractPropsFromTypeIfStatelessComponent(type: ts.Type): ts.Symbol {
        const callSignatures = type.getCallSignatures();

        if (callSignatures.length) {
            // Could be a stateless component.  Is a function, so the props object we're interested
            // in is the (only) parameter.

            for (let sig of callSignatures) {
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

    public extractPropsFromTypeIfStatefulComponent(type: ts.Type): ts.Symbol {
        const constructSignatures = type.getConstructSignatures();

        if (constructSignatures.length) {
            // React.Component. Is a class, so the props object we're interested
            // in is the type of 'props' property of the object constructed by the class.

            for (let sig of constructSignatures) {
                const instanceType = sig.getReturnType();
                const props = instanceType.getProperty('props');

                if (props) {
                    return props;
                }
            }
        }

        return null;
    }

    public getPropsInfo(propsObj: ts.Symbol, defaultProps: StringIndexedObject<string> = {}): Props {
        const propsType = this.checker.getTypeOfSymbolAtLocation(propsObj, propsObj.valueDeclaration);
        const propertiesOfProps = propsType.getProperties();

        const result: Props = {};

        propertiesOfProps.forEach(prop => {
            const propName = prop.getName();

            // Find type of prop by looking in context of the props object itself.
            const propType = this.checker.getTypeOfSymbolAtLocation(prop, propsObj.valueDeclaration);

            const propTypeString = this.checker.typeToString(propType);

            const isOptional = (prop.getFlags() & ts.SymbolFlags.Optional) !== 0;


            const jsDocComment = this.findDocComment(prop);

            let defaultValue = null;

            if (defaultProps[propName] !== undefined) {
                defaultValue = { value: defaultProps[propName] };
            } else if (jsDocComment.tags.default) {
                defaultValue = { value: jsDocComment.tags.default };
            }

            result[propName] = {
                required: !isOptional,
                type: { name: propTypeString },
                description: jsDocComment.fullComment,
                defaultValue
            };
        });

        return result;
    }

    findDocComment(symbol: ts.Symbol): JSDoc {
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
    getFullJsDocComment(symbol: ts.Symbol): JSDoc {

        // in some cases this can be undefined (Pick<Type, 'prop1'|'prop2'>)
        if (symbol.getDocumentationComment === undefined) {
            return defaultJSDoc;
        }

        const mainComment = ts.displayPartsToString(symbol.getDocumentationComment());

        const tags = symbol.getJsDocTags() || [];

        const tagComments: string[] = [];
        const tagMap: StringIndexedObject<string> = {};

        tags.forEach(tag => {
            const trimmedText = (tag.text || '').trim();
            const currentValue = tagMap[tag.name];
            tagMap[tag.name] = currentValue ? currentValue + '\n' + trimmedText : trimmedText;

            if (tag.name !== 'default') { tagComments.push(formatTag(tag)); }
        })

        return ({
            fullComment: (mainComment + '\n' + tagComments.join('\n')).trim(),
            tags: tagMap,
            description: mainComment
        });
    }

    extractDefaultPropsFromComponent(symbol: ts.Symbol, source: ts.SourceFile) {
        const possibleStatements = source.statements.filter(statement => this.checker.getSymbolAtLocation((statement as ts.ClassDeclaration).name) === symbol);
        if (!possibleStatements.length) {
            return {};
        }
        const statement = possibleStatements[0];
        if (statementIsClassDeclaration(statement) && statement.members.length) {
            const possibleDefaultProps = statement.members.filter(member => member.name && getPropertyName(member.name) === 'defaultProps');
            if (!possibleDefaultProps.length) {
                return {};
            }
            const defaultProps = possibleDefaultProps[0];
            const { initializer } = (defaultProps as ts.PropertyDeclaration);
            const { properties } = (initializer as ts.ObjectLiteralExpression);
            const propMap = (properties as ts.NodeArray<ts.PropertyAssignment>).reduce((acc, property) => {
                const literalValue = getLiteralValueFromPropertyAssignment(property);
                if (typeof literalValue === 'string') {
                    acc[getPropertyName(property.name)] = getLiteralValueFromPropertyAssignment(property);
                }
                return acc;
            }, {} as StringIndexedObject<string>)
            return propMap;
        }
        return {};
    }
}

function statementIsClassDeclaration (statement: ts.Statement): statement is ts.ClassDeclaration {
    return !!(statement as ts.ClassDeclaration).members;
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

function getLiteralValueFromPropertyAssignment(property: ts.PropertyAssignment): string | null {
    const { initializer } = property;
    switch(initializer.kind) {
        case ts.SyntaxKind.FalseKeyword:
            return 'false';
        case ts.SyntaxKind.TrueKeyword:
            return 'true';
        case ts.SyntaxKind.StringLiteral:
            return (initializer as ts.StringLiteral).text.trim();
        case ts.SyntaxKind.NumericLiteral:
            return `${(initializer as ts.NumericLiteral).text}`;
        case ts.SyntaxKind.NullKeyword:
            return 'null';
        case ts.SyntaxKind.Identifier:
            // can potentially find other identifiers in the source and map those in the future
            return (initializer as ts.Identifier).text === 'undefined' ? 'undefined' : null;
        case ts.SyntaxKind.ObjectLiteralExpression:
            // return the source text for an object literal
            return (initializer as ts.ObjectLiteralExpression).getText();
        default:
            return null;
    }
}

function formatTag (tag: ts.JSDocTagInfo) {
    let result = '@' + tag.name;
    if (tag.text) {
        result += ' ' + tag.text;
    }
    return result;
}

function computeComponentName(exp: ts.Symbol, source: ts.SourceFile) {
    const exportName = exp.getName();

    if (exportName === 'default') {
        // Default export for a file: named after file
        return path.basename(source.fileName, path.extname(source.fileName));
    } else {
        return exportName;
    }
}
