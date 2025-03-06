/* eslint-disable @typescript-eslint/no-var-requires */
const { getDefaultConfig } = require('@expo/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  transformer: {
    babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
    ...defaultConfig.transformer,
  },
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
  },
};
/* eslint-enable @typescript-eslint/no-var-requires */
