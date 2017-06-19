import * as React from 'react';

/**
 * A repro props interface
 */
export interface IReproProps {
    /** A foo property */
    foo: any;
}

/**
 * My InlineConst Component
 */
export class MyComponent extends React.Component<IReproProps, {}> {
    render() {
        const repeat = func => setInterval(func, 16);

        return (
            <div>test</div>
        );
    }
}
