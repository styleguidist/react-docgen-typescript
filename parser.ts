import * as path from 'path';
import * as ts from 'typescript';


const defaultOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest, 
    module: ts.ModuleKind.CommonJS
};

export interface ClassDoc {
    name: string;
    comment: string;
}

export interface InterfaceDoc {
    name: string;
    members: MemberDoc[];   
    comment: string;
}

export interface MemberDoc {
    name: string;
    text: string;
    type: string;
    isRequired: boolean;
    comment: string;
}

export interface FileDoc {
    classes: ClassDoc[];
    interfaces: InterfaceDoc[];
}
/** Generate documention for all classes in a set of .ts files */
export function getDocumentation(fileName: string, options: ts.CompilerOptions = defaultOptions): FileDoc {
    
    let program = ts.createProgram([fileName], options);
    let checker = program.getTypeChecker();
        
    const classes: ClassDoc[] = [];
    const interfaces: InterfaceDoc[] = [];
    
    const sourceFile = program.getSourceFile(fileName);
    ts.forEachChild(sourceFile, visit);

    /** visit nodes finding exported classes */    
    function visit(node: ts.Node) {
        // Only consider exported nodes
        if (!isNodeExported(node)) {
            return;
        }

        if (node.kind === ts.SyntaxKind.ClassDeclaration) {
            let symbol = checker.getSymbolAtLocation((<ts.ClassDeclaration>node).name);
            classes.push({
                name: symbol.name,
                comment: ts.displayPartsToString(symbol.getDocumentationComment()) 
            });            
        }

        if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
             if ((<ts.InterfaceDeclaration>node).parent === sourceFile) {
                 
                const symbol = checker.getSymbolAtLocation((<ts.InterfaceDeclaration>node).name);
                const type = checker.getTypeAtLocation((<ts.InterfaceDeclaration>node).name);
                
                const members = type.getProperties().map(i => {
                    const symbol = checker.getSymbolAtLocation(i.valueDeclaration.name);
                    const prop = i.valueDeclaration as ts.PropertySignature;
                    return {
                        name: i.getName(),                                        
                        text: i.valueDeclaration.getText(),
                        type: prop.type.getText(),
                        isRequired: prop.questionToken === null,
                        comment: ts.displayPartsToString(symbol.getDocumentationComment()),
                    };                    
                });
                
                const interfaceDoc: InterfaceDoc = {
                    name: symbol.getName(),
                    comment: ts.displayPartsToString(symbol.getDocumentationComment()),
                    members: members,
                };
                interfaces.push(interfaceDoc);
             }
         }
        else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
            // This is a namespace, visit its children
            ts.forEachChild(node, visit);
        }
    }    

    /** True if this is visible outside this file, false otherwise */
    function isNodeExported(node: ts.Node): boolean {
        return (node.flags & ts.NodeFlags.Export) !== 0 || (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
    }
    
    return {
        classes,
        interfaces,
    }
}


// /** Serialize a symbol into a json object */    
//     function serializeSymbol(symbol: ts.Symbol): DocEntry {
//         return {
//             name: symbol.getName(),
//             documentation: ts.displayPartsToString(symbol.getDocumentationComment()),
//             type: checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration))
//         };
//     }

//     /** Serialize a class symbol infomration */
//     function serializeClass(symbol: ts.Symbol) {
//         //console.log('flags: ', symbol.getFlags(), ' declarations:', symbol.getDeclarations());
//         let details = serializeSymbol(symbol);

//         // Get the construct signatures
//         let constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
//         details.constructors = constructorType.getConstructSignatures().map(serializeSignature);
//         return details;
//     }

//     /** Serialize a signature (call or construct) */
//     function serializeSignature(signature: ts.Signature) {
//         return {
//             parameters: signature.parameters.map(serializeSymbol),
//             returnType: checker.typeToString(signature.getReturnType()),
//             documentation: ts.displayPartsToString(signature.getDocumentationComment())
//         };
//     }
    