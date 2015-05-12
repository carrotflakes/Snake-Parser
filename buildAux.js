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

module.exports = {
	collectSymbols: collectSymbols,
	compose: compose,
};
