import * as ts from 'typescript';

export interface MemberType {
    type: string;
    values?: string[];
}

export interface InterfaceEntry {
    name: string;
    properties: PropertyEntry[];
    exported: boolean;
    comment: string;
}

export type VeriableKind = 'arrowFunction' | 'literal' | 'callExpression' | 'unknown';

export interface VariableEntry {
    name: string;
    exported: boolean;
    kind: VeriableKind;
    type: string;
    comment: string;
    initializerFlags: ts.TypeFlags;
    arrowFunctionType: string;
    arrowFunctionParams: string[];
    callExpressionArguments: string[];
}

export interface PropertyEntry {
    name: string;
    type: string;
    values: string[];
    isRequired: boolean;
    comment: string;
}

export interface MethodEntry {
    name: string;
}

export interface BaseClassEntry {
    name: string;
    typeArguments: string[];
}

export interface ClassEntry {
    name: string;
    exported: boolean;
    comment: string;
    baseType: BaseClassEntry;
    methods: MethodEntry[];
}

export interface ComponentDoc {
    name: string;
    extends: string;
    propInterface: InterfaceDoc;
    comment: string;
}

export interface InterfaceDoc {
    name: string;
    members: MemberDoc[];
    comment: string;
}

export interface MemberDoc {
    name: string;
    type: string;
    values?: string[];
    isRequired: boolean;
    comment: string;
}

export interface FileDoc {
    components: ComponentDoc[];
}