declare const Bar: React.FC<{ bar: string }>;

type FooBarProps = { foobar: string };

declare const FooBar: React.FC<FooBarProps>;

declare const Baz: (props: { baz: string }) => React.JSX.Element;

declare const Buzz: {
  (props: { buzz: string }): React.JSX.Element;
  propTypes: any;
};

export { Bar, Baz, FooBar, Buzz };
