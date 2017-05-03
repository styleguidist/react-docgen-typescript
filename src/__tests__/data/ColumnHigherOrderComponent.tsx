import * as React from 'react';
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

/** ColumnHighOrderComponent1 specific comment */
export const ColumnHighOrderComponent1 = hoc(Column);

export const ColumnHighOrderComponent2 = hoc(Column);

/** RowHighOrderComponent1 specific comment */
export const RowHighOrderComponent1 = hoc(Row);

export const RowHighOrderComponent2 = hoc(Row);

