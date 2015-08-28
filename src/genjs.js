var expressions = require("./expressions");

var indentStr = "\t";

var makeIndent = function(level) {
	return new Array(level + 1).join(indentStr);
};

var addIndent = function(str, level) {
	var indent = makeIndent(level);
	return indent + str.replace(/\n(?!$)/g, "\n" + indent);
};

var getId = function(ids, name) {
	if (name in ids)
		return ids[name];
	else
		return (ids[name] = 0);
};

var newId = function(ids, name) {
	if (name in ids)
		return ++ids[name];
	else
		return (ids[name] = 0);
};

var makeVarState = function(vs) {
	vs = vs.filter(function(v) {
		if (v instanceof Object)
			return v[0] !== null;
		else
			return v !== null;
	});
	vs = vs.map(function(v) {
		if (v instanceof Object)
			return v[0] + (v[1] ? " = " + v[1] : "");
		else
			return v;
	});
	return vs.length !== 0 ? "var " + vs.join(", ") + ";\n" : "";
};

var makeErrorLogging = function(pos, match, indentLevel) {
	var matchStr = stringify(match);
	var indent = makeIndent(indentLevel);
	return indent + "$matchingFail(" + pos + ", " + matchStr + ");\n";
};

var stringify = function(object) {
	return JSON.stringify(object)
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
};

expressions.nop.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	return addIndent(pass, indentLevel);
};

expressions.oc.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	if (this.children.length === 1)
		return this.children[0].gen(pos, objs, ids, pass, fail, indentLevel);
	var indent = makeIndent(indentLevel);
	var pos1 = null;
	var objs1 = null;
	var flag = "oc" + newId(ids, "oc");
	var pass1 = flag + " = true;\n";
	var fail1 = flag + " = false;\n";
	if (this.canAdvance())
		pos1 = "pos" + newId(ids, "pos");
	if (this.canProduce())
		objs1 = "objs" + newId(ids, "objs");
	for (var i = this.children.length - 1; 0 <= i; --i) {
		var reset = "";
		if (this.children[i].canAdvance())
			reset += pos + " = " + pos1 + ";\n";
		if (this.children[i].canProduce())
			reset += objs1 + " = [];\n";
		var ids1 = {};
		ids1.__proto__ = ids;
		fail1 = this.children[i].gen(/*pos1 || */pos, objs1 || objs, ids1, pass1, reset + fail1, 0);
	}
	var states = [];
//	states.push(indent + makeVarState([[pos1, pos], [objs1, "[]"], flag]));
	states.push(indent + makeVarState([[pos1, pos], [objs1, "[]"], flag]));
	states.push(addIndent(fail1, indentLevel));
	states.push(indent + "if (" + flag + ") {\n");
//	if (pos1)
//		states.push(indent + indentStr + pos + " = " + pos1 + ";\n");
	if (objs1)
		states.push(indent + indentStr + objs + ".push.apply(" + objs + ", " + objs1 + ");\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};
/*
var pos1, objs1, oc1;
pos1 = pos0;
objs1 = [];
children[0] の分岐 {
  oc1 = true;
} else {
  pos1 = pos0;
  objs1 = [];
  children[1] の分岐 {
    oc1 = true;
  } else {
	  oc1 = false;
  }
}
if (oc1) {
  // pass
} else {
  // fail
}

children[0].gen(
	"fail",
	children[1].gen(
		"fail",
		fail
	)
);
pass
*/


expressions.seq.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	if (this.children.length === 1)
		return this.children[0].gen(pos, objs, ids, pass, fail, indentLevel);
	var indent = makeIndent(indentLevel);
	var flag = "seq" + newId(ids, "seq");
	var fail1 = flag + " = false;\n";
	var pass1 = flag + " = true;\n";
	for (var i = this.children.length - 1; 0 <= i; --i)
		pass1 = this.children[i].gen(pos, objs, ids, pass1, fail1, 0);
	var states = [];
	states.push(indent + "var " + flag + ";\n");
	states.push(addIndent(pass1, indentLevel));
	states.push(indent + "if (" + flag + ") {\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

/*
children[0] の分岐 {
  children[1] の分岐 {
		// pass
	} else {
		// fail
	}
} else {
// fail
}

if (flg) {
} else {
}

*/

expressions.rep.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) { // TODO min max によって特殊化
	var indent = makeIndent(indentLevel);
	var pos1 = "pos" + newId(ids, "pos");
	var objs1 = "objs" + newId(ids, "objs");
	var flag = "rep" + newId(ids, "rep");
	var i = "i" + newId(ids, "i");
	var pass1 = pos + " = " + pos1 + ";\n" + objs + ".push.apply(" + objs + ", " + objs1 + ");\n";
	if (this.max === Infinity)
		pass1 = "if (" + pos + " === " + pos1 + ") throw new Error(\"Infinite loop detected.\");\n" + pass1;
	var fail1;
	if (0 < this.min)
		fail1 = flag + " = " + this.min + " <= " + i + ";\n" + "break " + flag + ";\n";
	else
		fail1 = flag + " = true;\n" + "break " + flag + ";\n";
	var states = [];
	states.push(indent + "var " + pos1 + ", " + objs1 + ", " + flag + " = true;\n");
	states.push(indent + flag + ":\n");
	if (this.max != Infinity)
		states.push(indent + "for (var " + i + " = 0; " + i + " < " + this.max + "; ++" + i + ") {\n");
	else
		states.push(indent + "for (var " + i + " = 0; ; ++" + i + ") {\n");
	states.push(indent + indentStr + pos1 + " = " + pos + ", " + objs1 + " = [];\n");
	states.push(this.child.gen(pos1, objs1, ids, pass1, fail1, indentLevel + 1));
	states.push(indent + "}\n");
	if (this.min === 0) {
		states.push(addIndent(pass, indentLevel));
	} else {
		states.push(indent + "if (" + flag + ") {\n");
		states.push(addIndent(pass, indentLevel + 1));
		states.push(indent + "} else {\n");
		states.push(addIndent(fail, indentLevel + 1));
		states.push(indent + "}\n");
	}
	return states.join("");
};
/*
var pos1, objs1, flag = false;
flag:
for (var i = 0; i < this.max; ++i) {
	pos1 = pos;
	objs1 = [];
	// child の処理
	if (child の結果) {
		if (pos === pos1 && this.max === Infinity)
			throw new InfiniteLoopError();
		pos0 = pos1;
		objs0.concat(objs1);
	} else {
		if (this.min <= i) {
			flag = true;
		}
		break flag;
	}
}
if (flag) {
	pass
} else {
	fail
}
*/


expressions.str.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	if (this.string.length === 0)
		return addIndent(pass, indentLevel);

	var indent = makeIndent(indentLevel);
	var states = [];
	if (this.string.length !== 1)
		states.push(indent + "if ($input.substr(" + pos + ", " + this.string.length + ") === " + stringify(this.string) + ") {\n");
	else
		states.push(indent + "if ($input.charCodeAt(" + pos + ") === " + this.string.charCodeAt() + ") {\n");
	states.push(indent + indentStr + pos + " += " + this.string.length + ";\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging(pos, stringify(this.string), indentLevel + 1));
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.cc.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var c = "c" + newId(ids, "c");
	var conds = [];
	for (var i in this.charactorClass) {
		var cc = this.charactorClass[i];
		if (cc.type === "range")
			conds.push("(" + cc.start + " <= " + c + " && " + c + " <= " + cc.end + ")");
		else
			conds.push(c + " == " + cc.char);
	}
	var states = [];
	states.push(indent + "var " + c + " = $input.charCodeAt(" + pos + ");\n");
	if (!this.invert) {
		if (conds.length === 0)
			states.push(indent + "if (false) {\n");
		else
			states.push(indent + "if (" + conds.join(" || ") + ") {\n");
	} else {
		if (conds.length === 0)
			states.push(indent + "if (true) {\n");
		else
			states.push(indent + "if (!isNaN(" + c + ") && !(" + conds.join(" || ") + ")) {\n");
	}
	states.push(indent + indentStr + pos + " += 1;\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging(pos, this.makeError(), indentLevel + 1));
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.cc.prototype.makeError = function() {
	return (this.invert ? "[^" : "[") + this.charactorClass.map(
		function(x) {
			if (x.type == "range")
				return String.fromCharCode(x.start) + "-" + String.fromCharCode(x.end)
			else
				return String.fromCharCode(x.char);
		}).join("") + "]";
};

expressions.ac.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "if (" + pos + " < $inputLength) {\n");
	states.push(indent + indentStr + pos + " += 1;\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging(pos, ".", indentLevel + 1));
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.obj.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var obj = "obj" + newId(ids, "obj");
	var objectize = "var " + obj + " = {};\n" + "for (var i in " + objs1 + ")\n" + indentStr + obj + "[" + objs1 + "[i].key] = " + objs1 + "[i].value;\n" + objs + ".push(" + obj + ");\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(pos, objs1, ids, objectize + pass, fail, indentLevel));
	return states.join("");
};

expressions.itm.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var obj = "obj" + newId(ids, "obj");
	var itemize = objs + ".push(" + "{key: " + stringify(this.key) + ", value: " + objs1 + "[0]}" + ");\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(pos, objs1, ids, itemize + pass, fail, indentLevel));
	return states.join("");
};

expressions.ci.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + objs + ".push({key: " + stringify(this.key) + ", value: " + stringify(this.value) + "});\n");
	states.push(addIndent(pass, indentLevel));
	return states.join("");
};

expressions.arr.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var arraying = objs + ".push(" + objs1 + ");\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(pos, objs1, ids, arraying + pass, fail, indentLevel));
	return states.join("");
};

expressions.tkn.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var pos1 = "pos" + newId(ids, "pos");
	var tokenize = objs + ".push($input.substring(" + pos + ", " + pos1 + "));\n" + pos + " = " + pos1 + ";\n";
	var states = [];
	states.push(indent + "var " + pos1 + " = " + pos + ";\n");
	states.push(this.child.gen(pos1, objs, ids, tokenize + pass, fail, indentLevel));
	return states.join("");
};

expressions.ltr.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var states = [];
	states.push(makeIndent(indentLevel) + objs + ".push(" + stringify(this.value) + ");\n");
	states.push(addIndent(pass, indentLevel));
	return states.join("");
};

expressions.pla.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var pos1 = "pos" + newId(ids, "pos");
	var objs1 = "objs" + newId(ids, "objs");
	var uem = "$errorMask -= 1;\n";
	var backtrack = objs1 + " = [];\n" + pos1 + " = " + pos + ";\n";
	var states = [];
	states.push(indent + "var " + pos1 + " = " + pos + ", " + objs1 + " = [];\n");
	states.push(indent + "$errorMask += 1;\n");
	states.push(this.child.gen(pos1, objs1, ids, uem + backtrack + pass, uem + fail, indentLevel));
	return states.join("");
};

expressions.nla.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var pos1 = "pos" + newId(ids, "pos");
	var objs1 = "objs" + newId(ids, "objs");
	var uem = "$errorMask -= 1;\n";
	var backtrack = objs1 + " = [];\n" + pos1 + " = " + pos + ";\n";
	var states = [];
	states.push(indent + "var " + pos1 + " = " + pos + ", " + objs1 + " = [];\n");
	states.push(indent + "$errorMask += 1;\n");
	states.push(this.child.gen(pos1, objs1, ids, uem + fail, uem + backtrack + pass, indentLevel));
	return states.join("");
}; // エラーロギング !

expressions.mod.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var modify;
	modify = objs + ".push(" + this.identifier + "(" + objs1 + "[0]));\n";
	//if (typeof(this.modifierSymbolOrFunction) === "string")
	//	modify = objs + ".push(" + this.modifierSymbolOrFunction + "(" + objs1 + "[0]));\n";
	//else
	//	modify = objs + ".push((" + this.modifierSymbolOrFunction.toString() + ")(" + objs1 + "[0]));\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(pos, objs1, ids, modify + pass, fail, indentLevel));
	return states.join("");
};

expressions.rul.prototype.gen = function(pos, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var mr = "mr" + newId(ids, "mr");
	var states = [];
	states.push(indent + "var " + mr + " = rule$" + this.ruleSymbol + "(" + pos + ");\n");
	states.push(indent + "if (" + mr + " instanceof Object) {\n");
	states.push(indent + indentStr + pos + " = " + mr + ".posision;\n");
	states.push(indent + indentStr + objs + ".push.apply(" + objs + ", " + mr + ".objects);\n");
	states.push(indent + indentStr + "undet += " + mr + ".undeterminate;\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(indent + indentStr + "undet += " + mr + ";\n");
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

var genRule = function(ruleSymbol, expression, indentLevel) {
	var indent = makeIndent(indentLevel);
	var ids = {};
	var pos = "pos";
	var objs = "objs";
	var memoKey = "key";
	var readMemo = "if (" + memoKey + " in $memo)\n" +
		indentStr + indentStr + "return $memo[" + memoKey + "];\n";
	var writeMatchTable = "if (!$matchTable[" + pos + "])\n" +
		indentStr + "$matchTable[" + pos + "] = " + stringify(ruleSymbol) + ";\n";
	var deleteMatchTable = "if ($matchTable[" + pos + "] === " + stringify(ruleSymbol) + ")\n" +
		indentStr + "$matchTable[" + pos + "] = null;\n";

	if (expression.canLeftRecurs(ruleSymbol, []) === 1) { // 左再帰対応
		var pos1 = "pos" + newId(ids, "pos");
		var res1 = "res" + newId(ids, "res");
		var fail = deleteMatchTable +
			"var " + res1 + " = $memo[" + memoKey + "];\n" +
			"if (" + res1 + " instanceof Object)\n" +
			indentStr + "undet = " + res1 + ".undeterminate -= 1;\n" +
			"else\n" +
			indentStr + "undet = " + res1 + " -= 1;\n" +
			"if (0 === undet)\n" +
			indentStr + "$memo[" + memoKey + "] = " + res1 + ";\n" +
			"else\n" +
			indentStr + "delete $memo[" + memoKey + "];\n" +
			"return " + res1 + ";\n";
		var pass = "if (" + pos1 + " <= rpos) {\n" +
			addIndent(fail, 1) +
			"}\n" +
			"rpos = " + pos1 + ";\n" +
			"$memo[" + memoKey + "] = {objects: " + objs + ", posision: " + pos1 + ", undeterminate: undet};\n" +
			"continue rec;\n";
		var states = [];
		states.push("function rule$" + ruleSymbol + "(" + pos + ") {\n");
		states.push(indent + indentStr + "var " + memoKey + " = " + stringify(ruleSymbol + "$") + " + " + pos + ", " + pos1 + ", rpos = -1, " + objs + " = [], undet = 0;\n");
		states.push(addIndent(readMemo, indentLevel + 1));
		states.push(addIndent(writeMatchTable, indentLevel + 1));
		states.push(indent + indentStr + "$memo[" + memoKey + "] = false;\n");
		states.push("rec:");
		states.push(indent + indentStr + "while (true) {\n");
		states.push(indent + indentStr + indentStr + "undet = 0; " + pos1 + " = pos; " + objs + " = [];\n");
		states.push(expression.gen(pos1, objs, ids, pass, fail, indentLevel + 2));
		states.push(indent + indentStr + "}\n");
		states.push(indent + "}");
		return states.join("");
	} else { // 左再帰非対応
		var pos1 = "pos" + newId(ids, "pos");
		var obj1 = "obj" + newId(ids, "obj");
		var pass = deleteMatchTable +
			"var " + obj1 + " = {objects: " + objs + ", posision: " + pos1 + ", undeterminate: undet};\n" +
			"if (undet === 0)\n" +
			indentStr + "$memo[" + memoKey + "] = " + obj1 + ";\n" +
			"return " + obj1 + ";\n";
		var fail = deleteMatchTable +
			"if (undet === 0)\n" +
			indentStr + "$memo[" + memoKey + "] = undet;\n" +
			"return undet;\n";
		var states = [];
		states.push("function rule$" + ruleSymbol + "(" + pos + ") {\n");
		states.push(indent + indentStr + "var " + memoKey + " = " + stringify(ruleSymbol + "$") + " + " + pos + ", " + pos1 + " = " + pos + ", " + objs + " = [], undet = 0;\n");
		states.push(addIndent(readMemo, indentLevel + 1));
		states.push(addIndent(writeMatchTable, indentLevel + 1));
		states.push(expression.gen(pos1, objs, ids, pass, fail, indentLevel + 1));
		states.push(indent + "}");
		return states.join("");
	}
};

/*
if (key in memo) return memo[key];
var lastRes = false;
rpos = -1;
memo[key] = false;
rec:
while (true) {
	det = true;
	pos1 = pos;
	objs = [];

	hogeeeeeee;

	if (pos1 <= rpos) { // 終わり
		if (lastRes === null) {
			return {hoge:hoge, determinate: det};
		} else {
			lastRes.determinate = true; // これtrueにしていいのか？
			memo[key] = lastRes;
			continue rec;
		}
	}
	rpos = pos1;
	lastRes = memo[key];
	memo[key] = {hoge:hoge, determinate: false};
	continue rec;
	// failなら・・lastResからのもう一度再帰 detをtrueにしてね。
}
//*/

var genjs = function(rules, initializer, exportVariable) {
	for (var r in rules)
		rules[r].prepare(rules);

	var states = [];
	if (exportVariable)
		states.push(exportVariable + " = ");
	states.push("(function() {\n");

	states.push(addIndent('function $parse($input) {\n\
	var $inputLength = $input.length;\n\
	var $memo = {};\n\
	var $matchTable = new Array($inputLength);\n\
	var $errorMask = 0;\n\
	var $failMatchs = [];\n\
	var $failPos = -1;\n\
', 1));

	// initializer
	states.push(initializer);

	// modifiers
	var modifiers = {};
	var modifierId = 0;
	for (var r in rules) {
		rules[r].traverse(function(expr) {
			if (expr instanceof expressions.mod) {
				if (!expr.identifier) {
					expr.identifier = "mod$" + modifierId++;
					modifiers[expr.identifier] = expr.code;
					states.push(makeIndent(2) + "function " + expr.identifier + "($) {\n" + expr.code + "\n" + indentStr + indentStr + "};" + "\n\n");
				}
			}
		});
	}

	// rules
	for (var key in rules) {
		states.push(makeIndent(2) + genRule(key, rules[key], 2) + ";\n\n");
	}

	states.push(addIndent('function $matchingFail(pos, match) {\n\
	if ($errorMask === 0 && $failPos <= pos) {\n\
		match = $matchTable[pos] ? $matchTable[pos] : match;\n\
		if ($failPos === pos) {\n\
			if ($failMatchs.indexOf(match) === -1)\n\
				$failMatchs.push(match);\n\
		} else {\n\
			$failMatchs = [match];\n\
			$failPos = pos;\n\
		}\n\
	}\n\
};', 2) + "\n\n");

	states.push(addIndent($joinByOr.toString() + ";", 2) + "\n\n");

	states.push(addIndent('	var $ret;\n\
	try {\n\
		var $result = rule$start(0);\n\
	} catch (e) {\n\
		if (e.message === "Infinite loop detected.")\n\
			$ret = {success: false, error: e.message}; \n\
		else\n\
			throw e;\n\
	}\n\
	if ($result instanceof Object) {\n\
		if ($result.posision === $inputLength)\n\
			$ret = {success: true, content: $result.objects[0]};\n\
		$matchingFail($result.posision, "end of input");\n\
	}\n\
	if (!$ret) {\n\
		var $line = ($input.slice(0, $failPos).match(/\\n/g) || []).length;\n\
		var $column = $failPos - $input.lastIndexOf("\\n", $failPos - 1) - 1;\n\
		$ret = {success: false, error: "Line " + ($line + 1) + ", column " + $column + ": Expected " + $joinByOr($failMatchs) + " but " + (JSON.stringify($input[$failPos]) || "end of input") + " found."};\n\
	}\n\
	return $ret;\n\
};\n', 1)); // Line , column : Expected  but  found.
	states.push(indentStr + "return $parse;\n");
	states.push("})();\n");
	return states.join("");
};

function $joinByOr(strs) {
	if (strs.length === 0)
		return "";
	if (strs.length === 1)
		return strs[0];
	return strs.slice(0, strs.length - 1).join(", ") + " or " + strs[strs.length - 1];
};

module.exports = genjs;
