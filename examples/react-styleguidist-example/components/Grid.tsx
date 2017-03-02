import * as React from 'react';
import { Component } from 'react';

/**
 * Grid properties.
 */
export interface IGridProps {
    /** prop1 description */
    prop1?: string;
    /** prop2 description */
    prop2: number;
    /**
     * prop3 description
     */
    prop3: () => void;
    /** prop4 description */
    prop4: 'option1' | 'option2' | 'option3';
}

/**
 * Form Grid.
 */
export class Grid extends Component<IGridProps, {}> {

    render() {
        return <div>Grid</div>;
    }
}

export default Grid;