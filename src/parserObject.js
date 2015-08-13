var expressions = require("./expressions");
expressions = expressions.expressions;
var genjs = require("./genjs");


var Parser = function(rules, modifier) {
	this.rules = rules;
	this.modifier = modifier;

//	rules[""] = new expressions.rul("start");

	for (var r in rules)
		rules[r].prepare(rules, modifier);
};
/*
Parser.prototype.parse = function(str) {
	var memo = [];
	var er;

	try {
		er = this.rules[""].match(str, 0, memo);
	} catch (e) {
		if (e instanceof InfiniteLoopError) {
			return {
				success: false,
				error: e.message,
			};
		} else {
			throw e;
		}
	}

	if (er.nodes !== undefined) {
		if (str.length !== er.ptr) {	// 成功したけどポインタが最後まで行ってない
			er = er.error;
			er.nexts.push("end of input");
		}
	}

	if (er.nodes === undefined) {
		var lac = getLineAndColumn(str, er.ptr);
		var error = "Line " + lac.line +
			", column " + lac.column +
			": Expected " + er.nexts.join(", ") +
			" but " + (JSON.stringify(str[er.ptr]) || "end of input") +
			" found.";

		return {
			success: false,
			error: error,
		};
	}

	return {
		success: true,
		content: er.nodes[0],
	};
};*/


Parser.prototype.toJavascript = function(exportVariable) {
	if (exportVariable === undefined)
		return genjs(this);
	return exportVariable + " = " + genjs(this);
};

var getLineAndColumn = function(str, ptr) {
	return {
		line: (str.slice(0, ptr).match(/\n/g) || []).length + 1,
		column: ptr - str.lastIndexOf("\n", ptr - 1),
	};
};

module.exports = Parser;
