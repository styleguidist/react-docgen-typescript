import * as React from 'react';
import { externalHoc } from "./ColumnHigherOrderComponentHoc";
/**
 * Column properties.
 */
export interface IColumnProps extends React.HTMLAttributes<any> {
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
 * Form column.
 */
class Column extends React.Component<IColumnProps, {}> {
    public static defaultProps: Partial<IColumnProps> = {
        prop1: 'prop1'
    };

    render() {
        const {prop1} = this.props;
        return <div>{prop1}</div>;
    }
}

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
const Row = (props: IRowProps) => {
    const innerFunc = (props: IRowProps) => {
        return <span>Inner Func</span>
    };
    const innerNonExportedFunc = (props: IRowProps) => {
        return <span>Inner Func</span>
    };
    return <div>Test</div>;
};

function hoc<T>(C: T): T {
    return ((props) => <div>{C}</div>) as any as T;
}

/** ColumnHigherOrderComponent1 specific comment */
export const ColumnHigherOrderComponent1 = hoc(Column);

export const ColumnHigherOrderComponent2 = hoc(Column);

/** RowHigherOrderComponent1 specific comment */
export const RowHigherOrderComponent1 = hoc(Row);

export const RowHigherOrderComponent2 = hoc(Row);

export const ColumnExternalHigherOrderComponent = externalHoc(Column);
export const RowExternalHigherOrderComponent = externalHoc(Row);

