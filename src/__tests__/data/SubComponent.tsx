import * as React from 'react';

export default function Root(props: { name: string }) {
  return <span>root {props.name}</span>;
}
Root.displayName = 'Root';

function Sub(props: { name: string }) {
  return <span>sub {props.name}</span>;
}
Sub.displayName = 'Sub';

Root.Sub = Sub;
