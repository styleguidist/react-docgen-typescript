const path = require('path');
const glob = require('glob');

module.exports = {
  title: 'React Style Guide Example',
  components: function () {
    return glob.sync(path.resolve(__dirname, 'components/**/*.tsx'))
      .filter(function (module) {
        return /\/[A-Z]\w*\.tsx$/.test(module);
      });
  },
  resolver: require('react-docgen').resolver.findAllComponentDefinitions,
  propsParser: require('react-docgen-typescript').withDefaultConfig().parse
};
