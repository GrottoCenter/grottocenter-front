const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');

module.exports = async ({ config }) => {
  const tsPaths = new TsconfigPathsPlugin({
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  });

  config.resolve.plugins
    ? config.resolve.plugins.push(tsPaths)
    : (config.resolve.plugins = [tsPaths]);

  config.module.rules.push({
    test: /\.scss$/,
    use: [
      // Creates `style` nodes from JS strings
      'style-loader',
      // Translates CSS into CommonJS, use css module
      {
        loader: 'css-loader',
        options: {
          modules: {
            localIdentName: '[name]__[local]___[hash:base64:5]'
          }
        }
      },
      // Compiles Sass to CSS
      'sass-loader'
    ]
  });

  config.resolve = {
    ...config.resolve,
    alias: {
      // Necessary for MUI StylesProvider injectFirst to work
      '@material-ui': path.resolve('./node_modules/@material-ui')
    }
  };

  return config;
};
