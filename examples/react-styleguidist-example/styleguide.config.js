var path = require('path');
var glob = require('glob');

module.exports = {
	title: 'React Style Guide Example',
	components: function() {
		return glob.sync(path.resolve(__dirname, 'components/**/*.tsx'))
			.filter(function(module) {
				return /\/[A-Z]\w*\.tsx$/.test(module);
			});
	},
	resolver: require('react-docgen').resolver.findAllComponentDefinitions,
	
	propsParser: require('../../lib/propTypesParser').parse,
	
	updateWebpackConfig: function(webpackConfig, env) {
		var dir = path.resolve(__dirname, 'lib');
        webpackConfig.resolve.extensions.push('.ts');
        webpackConfig.resolve.extensions.push('.tsx');
        
        webpackConfig.module.loaders.push(           
            { 
                test: /\.tsx?$/,
                include: __dirname,
                loader: 'ts-loader'
            }
        );
		return webpackConfig;
	}
};