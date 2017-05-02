import * as React from 'react';

/**
 * Row properties.
 */
export interface IRowProps {
    /** prop1 description */
    prop1?: string;
    /** prop2 description */
    prop2: number;
    /**
     * prop3 description
     */
    prop3: () => void;
    /** prop4 description */
    prop4: 'option1' | 'option2' | "option3";
}

/**
 * test
 * 
 */
export const test = (one: number) => {
    return one;
}

export const myObj = {
  foo: 'bar',
}

/**
 * Form row.
 */
export const ConstExportRow = (props: IRowProps) => {
    const innerFunc = (props: IRowProps) => {
        return <span>Inner Func</span>
    };
    const innerNonExportedFunc = (props: IRowProps) => {
        return <span>Inner Func</span>
    };
    return <div>Test</div>;
};

const nonExportedFunc = (props: IRowProps) => {
    return <div>No Export</div>
};

export default ConstExportRow;
