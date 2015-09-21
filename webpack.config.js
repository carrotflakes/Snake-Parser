module.exports = {
  entry: {
    build: './src/snakeParser.js',
  },
  output: {
    path: __dirname + "/dist",
    filename: "snakeParser.js",
    sourcePrefix: "",
  },
  module: {
    loaders: [
      { test: /snakeParser\.js/, loader: "expose?SnakeParser" }
    ]
  }
};

