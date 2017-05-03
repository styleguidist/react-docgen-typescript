import * as ts from 'typescript';
import { simplePrint } from './printUtils';
const args = process.argv.splice(2);
const fileName = args[0];
console.log('Priting file: ', fileName, ' args: ', args);

const defaultOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.CommonJS
};

const program = ts.createProgram([fileName], defaultOptions);
const sourceFile = program.getSourceFile(fileName);
const checker = program.getTypeChecker();

simplePrint(checker, sourceFile);
