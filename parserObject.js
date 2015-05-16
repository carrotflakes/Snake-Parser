var parserComponents = require("./parserComponents");
var functions = parserComponents.functions;
var mergeError = parserComponents.mergeError;
var uniqueAppend = parserComponents.uniqueAppend;
var buildAux = require("./buildAux");
var compose = buildAux.compose;
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

// できてない
Parser.prototype.toSource = function() {
	var f0 = function(d) {
		var ret = "";
		for (var k in d)
			ret += k + " =\n" + f1(d[k]) + "\n\n";
		return ret;
	};
	var f1 = function(d) {
		switch(d.op) {
		case ">":
			return f2(d.arg0) + ">" + d.arg1;
		case "|":
			return "(" + d.arg.map(f2).join("|") + ")";
		case " ":
			return "(" + d.arg.map(f2).join(" ") + ")";
		case "*":
			return "*" + f2(d.arg);
		case "+":
			return "+" + f2(d.arg);
		case "?":
			return "?" + f2(d.arg);
		case "c":
			return f2(d.arg);// + " {" + d.code + "}";
		case ":=":
			return d.arg0 + ":=" + d.arg1;
		case ":":
			return d.arg0 + ":" + f2(d.arg1);
		case "'":
			return d.arg;
		case "[^":
			return "[^" + d.arg + "]" + (d.insensitive === "1" ? "i" : "");
		case "[":
			return "[" + d.arg + "]" + (d.insensitive === "1" ? "i" : "");
		case "\\":
			return "~" + d.arg;
		case "@":
			return "@" + f2(d.arg);
		case "#":
			return "{" + f2(d.arg) + "}";
		case "`":
			return "`" + f2(d.arg);
		case "&":
			return "&" + f2(d.arg);
		case "!":
			return "!" + f2(d.arg);
		case "doll":
			//return "$" + f2(d.arg);
			return "`" + f2(d.arg);
		case ".":
			return ".";
		case "$":
			return d.arg;
		}
	};

	return f0(this.rules);
};

var getLineAndColumn = function(str, ptr) {
	return {
		line: (str.slice(0, ptr).match(/\n/g) || []).length + 1,
		column: ptr - str.lastIndexOf("\n", ptr - 1),
	};
};

var decompose = function(rules) {
	var traverse = function(r) {
		switch (r.op) {
		case "|":
		case " ":
			return "{op:" + JSON.stringify(r.op) + ",arg:[" + r.arg.map(traverse).join(",") + "]}";
		case "?":
		case "*":
		case "+":
		case "#":
		case "@":
		case "`":
		case "&":
		case "!":
			return "{op:" + JSON.stringify(r.op) + ",arg:" + traverse(r.arg) + "}";
		case "n":
			return "{op:" + JSON.stringify(r.op) + ",arg:" + traverse(r.arg) + ",n:" + r.n + "}";
		case "n-m":
			return "{op:" + JSON.stringify(r.op) + ",arg:" + traverse(r.arg) + ",n:" + r.n + ",m:" + r.m + "}";
		case "'":
		case "[":
		case "[^":
		case "\\":
			return "{op:" + JSON.stringify(r.op) + ",arg:" + JSON.stringify(r.arg) + "}";
		case ".":
			return "{op:" + JSON.stringify(r.op) + "}";
		case ":":
			return "{op:" + JSON.stringify(r.op) + ",arg0:" + JSON.stringify(r.arg0) + ",arg1:" + traverse(r.arg1) + "}";
		case ":=":
			return "{op:" + JSON.stringify(r.op) + ",arg0:" + JSON.stringify(r.arg0) + ",arg1:" + JSON.stringify(r.arg1) + "}";
		case ">":
			if (r.arg2 === undefined)
				return "{op:" + JSON.stringify(r.op) + ",arg0:" + traverse(r.arg0) + ",arg1:" + JSON.stringify(r.arg1) + "}";
			else
				return "{op:" + JSON.stringify(r.op) + ",arg0:" + traverse(r.arg0) + ",arg2:" + JSON.stringify(r.arg2) + "}";
		case "$":
			return "{op:" + JSON.stringify(r.op) + ",arg:" + JSON.stringify(r.arg) + "}";
		}
	};

	var us = [];

	for (var k in rules)
		if (k !== "")
			us.push(k + ":" + traverse(rules[k]));

	return "{" + us.join(",") + "}";
};


module.exports = Parser;
