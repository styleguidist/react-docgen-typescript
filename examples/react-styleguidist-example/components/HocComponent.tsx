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
 * Form row.
 */
class Component extends React.Component<IRowProps, {}> {

    render() {
    return <div>Test</div>;
    }
};

export function hoc<T>(Component: T): T {
    // do whatever you need but return the same type T
    return Component as T;
}

/** This example shows HocComponent */
export const HocComponent = hoc(Component);