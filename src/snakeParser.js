var buildParser = require("./build");
var Parser = require("./parserObject");
var expressions = require("./expressions");
expressions = expressions.expressions;

window.SnakeParser = {
	buildParser: buildParser,
	Parser: Parser,
	expressions: expressions,
};
