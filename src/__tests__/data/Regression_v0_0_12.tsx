import * as React from 'react';

type Coords = { x: number; y: number };

export interface Props extends React.HTMLAttributes<Element> {
  /**
   * The x-axis value of the zoom origin, which corresponds to the mouse pointer
   * location relative to the wrapped element without the zoom applied
   */
  originX: number;
  /** The y-axis value of the zoom origin, which corresponds to the mouse pointer
   * location relative to the wrapped element without the zoom applied
   */
  originY: number;
  /** The zoom level */
  scaleFactor: number;
  /** Maximum zoom level */
  maxScale?: number;
  /** Minimum zoom level */
  minScale?: number;
  /**
   * The zoom change handler for controlled components.
   * It should update the other props in order to reflect the zoom change.
   */
  onZoom(
    scale: number,
    translateX: number,
    translateY: number,
  ): void;
}

type Matrix = string;

interface State {
  matrix: Matrix;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

function getCanZoomIn({ maxScale = Infinity, scaleFactor }: Props): boolean {
  return scaleFactor < maxScale;
}

function getCanZoomOut({ minScale = Infinity, scaleFactor }: Props): boolean {
  return scaleFactor > minScale;
}

/** A Zoomable component wraps any DOM element and provides mouse-based
 * zooming capabilities. Support for touch gestures is planned soon.
 */
export class Zoomable extends React.PureComponent<Props, State> {

  render() {
    const {
      style,
      className,
      children,
      scaleFactor,
      onZoom,
      minScale,
      maxScale,
      originX,
      originY,
      ...rest,
    } = this.props;
    const { canZoomIn, canZoomOut } = this.state;

    return (
      <div />
    );
  }
}

export default Zoomable;