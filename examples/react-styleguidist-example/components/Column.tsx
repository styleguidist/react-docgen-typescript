import * as React from 'react';
import { Component } from 'react';

/**
 * Column properties.
 */
export interface IColumnProps {
	/** simple class name */
    className?: string;
	/** super simple property */
    prop1: number;
	/** callback property */
    prop2: () => void;
	/** Enum props */
    prop3: 'option1' | 'option2' | "option3";
}

/**
 * Form column.
 */
export class Column extends Component<IColumnProps, {}> {

    render() {
        return (
            <div>test</div>
        );
    }            
}

export default Column;