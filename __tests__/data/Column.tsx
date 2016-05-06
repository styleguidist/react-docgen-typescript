import * as React from 'react';
import { Component, PropTypes, Children, EventHandler, KeyboardEvent } from 'react';
import * as classNames from 'classnames';

/**
 * Column properties.
 */
export interface IColumnProps {
	/** simple class name */
    className?: string;
	/** super simple prop */
    prop1: number;
	/** callbackx prop */
    prop2: () => void;
	/** Enum props */
    prop3: 'option1' | 'option2' | 'option3';
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