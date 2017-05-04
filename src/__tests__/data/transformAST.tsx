import { externalHoc } from './transformAST_hoc';

const unexportedVar = 10;
export const exportedVar = 10;

/** unexportedVarFunction comment */
const unexportedVarFunction = (param1: string): number => 0
;
/** exportedVarFunction comment */
export const exportedVarFunction = (param1: number, param2: string): string => "";

function unexportedFunction(param1: number): string {
    return "";
}

function exportedFunction(param1: string, param2: number): number {
    return 0;
}

interface UnexportedInterface {
    /** prop1 comment */
    prop1: string;
}

export interface ExportedInterface {
    /** prop1 comment */
    prop1: string;
    /** prop2 comment */
    prop2: string;
}

export class OurBaseClass<T1, T2> {
}

/** UnexportedClass comment */
class UnexportedClass extends OurBaseClass<ExportedInterface, {}> {
    method1(): string {
        return "";
    }
}

/** ExportedClass comment */
export class ExportedClass {
    method1(): string {
        return "";
    }
    method2(): number {
        return 0;
    }
}

export function hoc<T>(component: T): T {
    return component;
}

/** exportedHoc1 comment */
export const exportedHoc1 = hoc(ExportedClass);

/** exportedHoc2 comment */
export const exportedHoc2 = hoc(exportedFunction);


/** exportedExternalHoc1 comment */
export const exportedExternalHoc1 = externalHoc(ExportedClass);

/** exportedExternalHoc2 comment */
export const exportedExternalHoc2 = externalHoc(exportedFunction);
