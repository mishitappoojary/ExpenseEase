// metro.config.js
module.exports = {
  transformer: {
    babelTransformerPath: require.resolve('metro-react-native-babel-preset'),
  },
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx'], // Add ts and tsx if you are using TypeScript
  },
};
