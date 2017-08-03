import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

export interface ComponentDoc {
    displayName: string;
    description: string;
    props: Props;
}

export interface Props {
    [key: string]: PropItem;
}

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

const defaultOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.CommonJS
};

/**
 * Parses a file with default TS options
 * @param filePath 
 */
export function parse(filePath: string) {
    return withCompilerOptions(defaultOptions).parse(filePath);
}

/**
 * Constructs a parser for a specified tsconfig file.
 */
export function withConfig(tsconfigPath: string) {
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
export function withCompilerOptions(compilerOptions: ts.CompilerOptions) {
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

            return components;
        }
    };
}

class Parser {
    private checker: ts.TypeChecker;

    constructor(program: ts.Program) {
        this.checker = program.getTypeChecker();
    }

    public getComponentInfo(exp: ts.Symbol, source: ts.SourceFile): ComponentDoc {
        const type = this.checker.getTypeOfSymbolAtLocation(exp, exp.valueDeclaration);

        let propsType = this.extractPropsFromTypeIfStatelessComponent(type);
        if (!propsType) {
            propsType = this.extractPropsFromTypeIfStatefulComponent(type);
        }

        if (propsType) {
            const componentName = computeComponentName(exp, source);
            const props = this.getPropsInfo(propsType);

            return {
                displayName: componentName,
                description: this.findDocComment(exp),
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

    public getPropsInfo(propsObj: ts.Symbol): Props {
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

            result[propName] = {
                required: !isOptional,
                type: { name: propTypeString },
                description: jsDocComment,

                // TODO
                defaultValue: null
            };
        });

        return result;
    }

    findDocComment(symbol: ts.Symbol) {
        const comment = this.getFullJsDocComment(symbol);
        if (comment) {
            return comment;
        }

        const rootSymbols = this.checker.getRootSymbols(symbol);
        const commentsOnRootSymbols = rootSymbols
            .filter(x => x !== symbol)
            .map(x => this.getFullJsDocComment(x))
            .filter(x => !!x);

        if (commentsOnRootSymbols.length) {
            return commentsOnRootSymbols[0];
        }

        return '';
    }

    /**
     * Extracts a full JsDoc comment from a symbol, even
     * thought TypeScript has broken down the JsDoc comment into plain
     * text and JsDoc tags.
     */
    getFullJsDocComment(symbol: ts.Symbol) {

        const mainComment = ts.displayPartsToString(symbol.getDocumentationComment());

        const tags = symbol.getJsDocTags() || [];
        const tagComments = tags.map(t => {
            let result = '@' + t.name;
            if (t.text) {
                result += ' ' + t.text;
            }
            return result;
        });

        return (mainComment + '\n' + tagComments.join('\n')).trim();
    }
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
