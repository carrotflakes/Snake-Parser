var buildParser = require("./build");
var Parser = require("./parserObject");
var genjs = require("./genjs");

window.SnakeParser = {
	buildParser: buildParser,
	Parser: Parser,
	genjs: genjs,
};
