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

/** exportedHoc comment */
export const exportedHoc = hoc(ExportedClass);