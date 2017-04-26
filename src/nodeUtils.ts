import * as ts from 'typescript';

export function navigate(node: ts.Node, ...path: ts.SyntaxKind[]): ts.Node {
    let index = 0;
    path.forEach(expectedKind => {
        ts.forEachChild(node, subNode => {
            if (subNode.kind === expectedKind) {
                node = subNode;
                index++;
            } 
        });        
    });
    return index === path.length ? node : null;
}

export function getFlatChildren(node: ts.Node): ts.Node[] {
    const result = [];
    
    function f(node: ts.Node) {
        result.push(node);
        ts.forEachChild(node, f);  
    }
    
    if (node === null) {
        return [];
    }
    
    f(node);
    
    return result;
}