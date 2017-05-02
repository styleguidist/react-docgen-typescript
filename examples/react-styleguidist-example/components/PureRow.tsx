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
export class PureRow extends React.PureComponent<IRowProps, {}> {

    render() {
    return <div>Test</div>;
    }
};

export default PureRow;