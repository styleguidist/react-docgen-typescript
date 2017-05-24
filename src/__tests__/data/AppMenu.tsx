import * as React from 'react';

/** App Menu Props */
export interface IAppMenuProps {
  /** Menu items */
  menu: any;
}

export interface IAppMenuState {
  menu: any;
}

/** App Menu Component */
export class AppMenu extends React.Component<IAppMenuProps, IAppMenuState> {
  constructor(props, context) {
    super(props, context);
    this.state = {
      menu: this.props.menu
    };

    this.handleClick  = this.handleClick.bind(this);
  }

  componentWillReceiveProps(newProps: IAppMenuProps) {

  }

  handleClick( info ) {

  }

  render() {
    return (
      <div onClick={this.handleClick}>
        test
      </div>
    );
  }
}