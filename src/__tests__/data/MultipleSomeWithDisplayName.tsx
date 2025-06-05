import * as React from 'react';

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {}

export const Button1 = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <button {...props} ref={ref} type="button" />
);
Button1.displayName = 'First';

export const NoExplicitDisplayName1 = (props: any) => <div>Some text</div>;

export const Button2 = (props: ButtonProps) => (
  <button {...props} type="button" />
);
Button2.displayName = 'Second';

export const NoExplicitDisplayName2 = (props: any) => <div>Some more text</div>;
