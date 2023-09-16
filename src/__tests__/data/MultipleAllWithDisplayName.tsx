import * as React from 'react';

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <button {...props} ref={ref} type="button" />
);

Button.displayName = 'First';

export const SubmitButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <button {...props} ref={ref} type="submit" />
);

SubmitButton.displayName = 'Second';

export const ResetButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <button {...props} ref={ref} type="reset" />
);

ResetButton.displayName = 'Third';
