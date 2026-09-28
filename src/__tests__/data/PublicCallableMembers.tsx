interface ComponentType {
  /** @public */
  (props: { label: string }): null;

  /** @public */
  displayName: string;

  /** @public */
  customMethod(value: string): number;
}

export declare const Example: ComponentType;
