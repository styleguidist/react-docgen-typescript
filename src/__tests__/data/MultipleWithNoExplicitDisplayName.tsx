import * as React from 'react';

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {}

export const Button = (props: ButtonProps) => (
  <button {...props} type="button" />
);
export const SubmitButton = (props: ButtonProps) => (
  <button {...props} type="submit" />
);
export const ResetButton = (props: ButtonProps) => (
  <button {...props} type="reset" />
);
