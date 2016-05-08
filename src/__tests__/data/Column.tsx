import * as React from 'react';
import { Component, PropTypes, Children, EventHandler, KeyboardEvent } from 'react';
import * as classNames from 'classnames';

/**
 * Column properties.
 */
export interface IColumnProps {
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
export class Column extends Component<IColumnProps, {}> {

    static propTypes: any = {
        /** Additional class name that will be included on the element. */
        className: PropTypes.string,
    }
    
    render() {
        
        const { className } = this.props;
        return (
            <div className={classNames('st-col', className)}>
                {this.props.children}
            </div>
        );
    }            
}

export default Column;