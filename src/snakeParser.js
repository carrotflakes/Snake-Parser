var buildParser = require("./build");
var expressions = require("./expressions");
expressions = expressions.expressions;

window.SnakeParser = {
	buildParser: buildParser,
	expressions: expressions,
};
