import React from "react";

interface Props {
  /* the main text */
  text: string;
}

/**
 * Print text in a div
 */
export function MyComponent({ text }: Props) {
  return <div>{text}</div>;
}

/**
 * get the sum of 2 numbers
 * @param a the magical first number
 * @param b boring second number
 */
export function add(a: number, b: number): string {
  return `${a + b}`;
}
