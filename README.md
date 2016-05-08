# react-docgen-typescript

Simple parser for react properties defined in typescript instead of propTypes. 

It can be used with [react-styleguidist](https://github.com/sapegin/react-styleguidist).

## react-styleguidist integration

Include following line in your `styleguide.config.js`:

```javascript
propsParser: require('react-docgen-typescript').parse
```

## Thanks
The integration with reac-styleguidist wouldn't be possible without [Vyacheslav Slinko](https://github.com/vslinko) pull request [#118](https://github.com/sapegin/react-styleguidist/pull/118) react-styleguidist.
