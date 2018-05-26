module.exports = {
  entry: {
    build: __dirname + '/src/index.js',
  },
  output: {
    path: __dirname + "/js",
    filename: "bundle.js",
  },
  optimization: {
    minimize: false,
  },
  module: {
  },
};
