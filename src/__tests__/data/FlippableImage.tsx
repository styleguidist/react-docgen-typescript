import * as React from 'react';

export type Props = React.HTMLAttributes<HTMLImageElement> & {
  /** whether the image is flipped horizontally */
  isFlippedX?: boolean;
  /** whether the image is flipped vertically */
  isFlippedY?: boolean;
}

/** An enhanced image component */
export const FlippableImage = (props: Props) => {
  const {
    src,
    isFlippedX = false,
    isFlippedY = false,
    style,
    ...rest,
  } = props;

  let transform = '';
  if (isFlippedX) {
    transform += ` scale(-1, 1)`;
  }
  if (isFlippedY) {
    transform += ` scale(1, -1)`;
  }

  return (
    <img
      src={src || undefined}
      style={{ ...style, transform }}
      {...rest}
    />
  );
};

export default FlippableImage;