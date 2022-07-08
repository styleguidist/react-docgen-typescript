import * as React from 'react';

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <button {...props} ref={ref} type="button" />
);

Button.displayName = 'First';

export const someSeparateFunction = () => {};
