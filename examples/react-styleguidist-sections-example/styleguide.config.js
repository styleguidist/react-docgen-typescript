const path = require('path');
const glob = require('glob');

module.exports = {
  title: 'React Style Guide Example',
  pagePerSection: true,
  sections: [ {
    name: 'Test section 1',
    description: 'Test secion 1 description',
    components: function () {
      return glob.sync(path.resolve(__dirname, 'components/**/*.tsx'))
        .filter(function (module) {
          return /\/[A-Z]\w*\.tsx$/.test(module);
        });
    },
  }, {
    name: 'Test secion 2',
    description: 'Test section 2 description'
  }],
  resolver: require('react-docgen').resolver.findAllComponentDefinitions,
  propsParser: require('react-docgen-typescript').withDefaultConfig({ propFilter: { skipPropsWithoutDoc: true } }).parse
};