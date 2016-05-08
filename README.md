# react-docgen-typescript

A simple parser for react properties defined in typescript instead of propTypes. 

It can be used with [react-styleguidist](https://github.com/sapegin/react-styleguidist).

## Installation 

```
npm install --save-dev react-docgen-typescript
```

## react-styleguidist integration

Include following line in your `styleguide.config.js`:

```javascript
propsParser: require('react-docgen-typescript').parse
```
## Example

In the example folder you can see react-styleguidist integration.

The component [`Column.tsx`](./example/react-styleguidist-example/components/Column.tsx)

```javascript
import * as React from 'react';
import { Component } from 'react';

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
    prop4: 'option1' | 'option2' | 'option3';
}

/**
 * Form column.
 */
export class Column extends Component<IColumnProps, {}> {
    
    render() {
        return <div>Test</div>;
    }            
}

export default Column;
```

Will generate the following stylesheet:
![Stylesheet example](./stylesheet-example.png "Stylesheet example")


## Thanks
The integration with reac-styleguidist wouldn't be possible without [Vyacheslav Slinko](https://github.com/vslinko) pull request [#118](https://github.com/sapegin/react-styleguidist/pull/118) react-styleguidist.
