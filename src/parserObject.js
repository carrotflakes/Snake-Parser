var parserComponents = require("./parserComponents");
var functions = parserComponents.functions;
var mergeError = parserComponents.mergeError;
var uniqueAppend = parserComponents.uniqueAppend;
var buildAux = require("./buildAux");
var compose = buildAux.compose;
var decompose = buildAux.decompose;
var collectSymbols = buildAux.collectSymbols;
var InfiniteLoopError = require("./infiniteLoopError");


var Parser = function(rules, modifier) {
	this.rules = rules;
	this.modifier = modifier;

	compose(rules, modifier);
};

Parser.prototype.parse = function(str) {
	var memo = [];
	var er;

	try {
		er = this.rules[""].f(this.rules[""].arg_, str, 0, memo);
	} catch (e) {
		if (e instanceof InfiniteLoopError) {
			return {
				success: false,
				error: e.message,
			};
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
};


Parser.prototype.toJavascript = function(str) {
	var states = [];
	states.push("\tvar mergeError = " + mergeError.toString() + ";");

	states.push("\tvar uniqueAppend = " + uniqueAppend.toString() + ";");

	var fs = [];
	for (var k in functions) {
		fs.push(JSON.stringify(k) + ": " + functions[k].toString());
	}
	states.push("\tvar functions = {" + fs.join(", ") + "};");

	states.push("\tvar compose = " + compose.toString() + ";");

	states.push("\tvar getLineAndColumn = " + getLineAndColumn.toString() + ";");

	states.push("\tvar rules = " + decompose(this.rules) + ";");

	var ms = [];
	for (var k in this.modifier) {
		ms.push(JSON.stringify(k) + ": " + this.modifier[k].toString());
	}
	states.push("\tvar modifier = {" + ms.join(", ") + "};");

	states.push("\tcompose(rules, modifier);");

	states.push('	var er = rules[""].f(rules[""].arg_, str, 0, []);\n	if (er.nodes !== undefined) {\n		if (str.length !== er.ptr) {\n			er = er.error;\n			er.nexts.push("end of input");\n		}\n	}\n	\n	if (er.nodes === undefined) {\n		var lac = getLineAndColumn(str, er.ptr);\n		return {success: false, error: "Line " + lac.line + ", column " + lac.column + ": Expected " + er.nexts.join(", ") + " but " + (JSON.stringify(str[er.ptr]) || "end of input") + " found."};\n	}\n	return {success: true, content: er.nodes[0]};');

	return "function(str) {\n" + states.join("\n\n") + "\n}\n";
};

var getLineAndColumn = function(str, ptr) {
	return {
		line: (str.slice(0, ptr).match(/\n/g) || []).length + 1,
		column: ptr - str.lastIndexOf("\n", ptr - 1),
	};
};

module.exports = Parser;
