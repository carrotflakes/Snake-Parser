var parserComponents = require("./parserComponents");
var functions = parserComponents.functions;

var collectSymbols = function(rules) {
	var syms = [], msyms = [];

	var traverse = function(r) {
		switch (r.op) {
		case "|":
		case " ":
			for (var i = 0, il = r.arg.length; i < il; ++i)
				traverse(r.arg[i]);
			return;
		case "?":
		case "*":
		case "n":
		case "n-m":
		case "+":
		case "#":
		case "@":
		case "`":
		case "&":
		case "!":
			traverse(r.arg);
			return;
		case ":":
			traverse(r.arg1);
			return;
		case ">":
			if (r.arg1 !== undefined && msyms.indexOf(r.arg1) === -1)
				msyms.push(r.arg1);
			traverse(r.arg0);
			return;
		case "$":
			if (syms.indexOf(r.arg) === -1)
				syms.push(r.arg);
			return;
		}
	};

	for (var k in rules)
		traverse(rules[k]);

	return {symbols: syms, modifierSymbols: msyms};
};

var compose = function(rules, modifier) {
	var traverse = function(r) {
		switch (r.op) {
		case "|":
		case " ":
			r.f = [];
			for (var i = 0, il = r.arg.length; i < il; ++i) {
				traverse(r.arg[i]);
				r.f[i] = functions[r.arg[i].op];
			}
			return;
		case "?":
		case "*":
		case "n":
		case "+":
		case "#":
		case "@":
		case "`":
		case "&":
		case "!":
			traverse(r.arg);
			r.f = functions[r.arg.op];
			return;
		case "n-m":
			traverse(r.arg);
			r.f = functions[r.arg.op];
			return;
		case ":":
			traverse(r.arg1);
			r.f = functions[r.arg1.op];
			return;
		case ">":
			if (r.arg1 === undefined)
				r.argf = new Function("$", r.arg2);
			else
				r.argf = modifier[r.arg1];
			traverse(r.arg0);
			r.f = functions[r.arg0.op];
			return;
		case "$":
			r.arg_ = rules[r.arg];
			r.f = functions[r.arg_.op];
			return;
		}
	};

	rules[""] = {"op":"$","arg":"start"};

	for (var k in rules)
		traverse(rules[k]);
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

module.exports = {
	collectSymbols: collectSymbols,
	compose: compose,
	decompose: decompose,
};
