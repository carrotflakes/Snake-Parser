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

expressions.nop.prototype.gen = function(ids, indentLevel) {
	return "";
};

expressions.oc.prototype.gen = function(ids, indentLevel) {
	if (this.children.length === 1)
		return this.children[0].gen(ids, indentLevel);
	var indent = makeIndent(indentLevel);
	var pos = "pos" + newId(ids, "pos");
	var objsLen = "objsLen" + newId(ids, "objsLen");
	var states = [];
	states.push(indent + makeVarState([[pos, "pos"], [objsLen, "objs.length"]]));
	states.push(indent + "succeed = false;\n");
	for (var i in this.children) {
		states.push(indent + "if (!succeed) {\n");
		states.push(indent + indentStr + "pos = " + pos + ";\n");
		states.push(indent + indentStr + "objs.length = " + objsLen + ";\n");
		var ids1 = {};
		ids1.__proto__ = ids;
		states.push(this.children[i].gen(ids1, indentLevel + 1));
		states.push(indent + "}\n");
	}
	return states.join("");
};


expressions.seq.prototype.gen = function(ids, indentLevel) {
	if (this.children.length === 1)
		return this.children[0].gen(ids, indentLevel);
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "succeed = true;\n");
	for (var i in this.children) {
		states.push(indent + "if (succeed) {\n");
		states.push(this.children[i].gen(ids, indentLevel + 1));
		states.push(indent + "}\n");
	}
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

expressions.rep.prototype.gen = function(ids, indentLevel) { // TODO min max によって特殊化
	var indent = makeIndent(indentLevel);
	var pos = "pos" + newId(ids, "pos");
	var objsLen = "objsLen" + newId(ids, "objsLen");
	var i = "i" + newId(ids, "i");

	var states = [];
	states.push(indent + makeVarState([[pos, "pos"], [objsLen, "objs.length"]]));
	if (this.max != Infinity)
		states.push(indent + "for (var " + i + " = 0; " + i + " < " + this.max + "; ++" + i + ") {\n");
	else
		states.push(indent + "for (var " + i + " = 0; ; ++" + i + ") {\n");
	states.push(this.child.gen(ids, indentLevel + 1));
	states.push(indent + indentStr + "if (succeed) {\n");
	if (this.max === Infinity)
		states.push(indent + indentStr + "if (pos === " + pos + ") throw new Error(\"Infinite loop detected.\");\n");
	states.push(indent + indentStr + indentStr + pos + " = pos;\n");
	states.push(indent + indentStr + indentStr + objsLen + " = objs.length;\n");
	states.push(indent + indentStr + "} else {\n");
	states.push(indent + indentStr + indentStr + "pos = " + pos + ";\n");
	states.push(indent + indentStr + indentStr + "objs.length = " + objsLen + ";\n");
	states.push(indent + indentStr + indentStr + "break;\n");
	states.push(indent + indentStr + "}\n");
	states.push(indent + "}\n");
	states.push(indent + "succeed = " + this.min + " <= " + i + ";\n");
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


expressions.str.prototype.gen = function(ids, indentLevel) {
	if (this.string.length === 0)
		return "succeed = true;\n";

	var indent = makeIndent(indentLevel);
	var states = [];
	if (this.string.length !== 1)
		states.push(indent + "if (succeed = $input.substr(pos, " + this.string.length + ") === " + stringify(this.string) + ") {\n");
	else
		states.push(indent + "if (succeed = $input.charCodeAt(pos) === " + this.string.charCodeAt() + ") {\n");
	states.push(indent + indentStr + "pos += " + this.string.length + ";\n");
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging("pos", stringify(this.string), indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.cc.prototype.gen = function(ids, indentLevel) {
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
	states.push(indent + "var " + c + " = $input.charCodeAt(pos);\n");
	if (!this.invert) {
		if (conds.length === 0)
			states.push(indent + "if (succeed = false) {\n");
		else
			states.push(indent + "if (succeed = " + conds.join(" || ") + ") {\n");
	} else {
		if (conds.length === 0)
			states.push(indent + "if (succeed = true) {\n");
		else
			states.push(indent + "if (succeed = !isNaN(" + c + ") && !(" + conds.join(" || ") + ")) {\n");
	}
	states.push(indent + indentStr + "pos += 1;\n");
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging("pos", this.makeError(), indentLevel + 1));
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

expressions.ac.prototype.gen = function(ids, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "if (succeed = pos < $inputLength) {\n");
	states.push(indent + indentStr + "pos += 1;\n");
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging("pos", ".", indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.obj.prototype.gen = function(ids, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objsLen = "objsLen" + newId(ids, "objsLen");
	var obj = "obj" + newId(ids, "obj");
	var states = [];
	states.push(indent + makeVarState([[objsLen, "objs.length"]]));
	states.push(this.child.gen(ids, indentLevel));
	states.push(indent + "if (succeed) {\n");
	states.push(indent + indentStr + "var " + obj + " = {};\n");
	states.push(indent + indentStr + "for (var i = " + objsLen + "; i < objs.length; i++)\n");
	states.push(indent + indentStr + indentStr + obj + "[objs[i].key] = objs[i].value;\n");
	states.push(indent + indentStr + "objs.length = " + objsLen + " + 1;\n");
	states.push(indent + indentStr + "objs[" + objsLen + "] = " + obj + ";\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.itm.prototype.gen = function(ids, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objsLen = "objsLen" + newId(ids, "objsLen");
	var states = [];
	states.push(indent + makeVarState([[objsLen, "objs.length"]]));
	states.push(this.child.gen(ids, indentLevel));
	states.push(indent + "if (succeed) {\n");
	states.push(indent + indentStr + "objs[" + objsLen + "] = {key: " + stringify(this.key) + ", value: objs[objs.length - 1]};\n");
	states.push(indent + indentStr + "objs.length = " + objsLen + " + 1;\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.ci.prototype.gen = function(ids, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "objs.push({key: " + stringify(this.key) + ", value: " + stringify(this.value) + "});\n");
	states.push(indent + "succeed = true;\n");
	return states.join("");
};

expressions.arr.prototype.gen = function(ids, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objsLen = "objsLen" + newId(ids, "objsLen");
	var states = [];
	states.push(indent + makeVarState([[objsLen, "objs.length"]]));
	states.push(this.child.gen(ids, indentLevel));
	states.push(indent + "if (succeed) {\n");
	states.push(indent + indentStr + "objs[" + objsLen + "] = objs.slice(" + objsLen + ");\n");
	states.push(indent + indentStr + "objs.length = " + objsLen + " + 1;\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.tkn.prototype.gen = function(ids, indentLevel) {
	var indent = makeIndent(indentLevel);
	var pos = "pos" + newId(ids, "pos");
	var states = [];
	states.push(indent + makeVarState([[pos, "pos"]]));
	states.push(this.child.gen(ids, indentLevel));
	states.push(indent + "if (succeed) {\n");
	states.push(indent + indentStr + "objs.push($input.substring(" + pos + ", pos));\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.ltr.prototype.gen = function(ids, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "objs.push(" + stringify(this.value) + ");\n");
	states.push(indent + "succeed = true;\n");
	return states.join("");
};

expressions.pla.prototype.gen = function(ids, indentLevel) {
	var indent = makeIndent(indentLevel);
	var pos = "pos" + newId(ids, "pos");
	var objsLen = "objsLen" + newId(ids, "objsLen");
	var states = [];
	states.push(indent + makeVarState([[pos, "pos"], [objsLen, "objs.length"]]));
	states.push(indent + "$errorMask += 1;\n");
	states.push(this.child.gen(ids, indentLevel));
	states.push(indent + "$errorMask -= 1;\n");
	//states.push(indent + "if (succeed) {\n");
	states.push(addIndent("objs.length = " + objsLen + ";\n" +
												"pos = " + pos + ";\n", indentLevel));
	//states.push(indent + "}\n");
	return states.join("");
};

expressions.nla.prototype.gen = function(ids, indentLevel) {
	var indent = makeIndent(indentLevel);
	var pos = "pos" + newId(ids, "pos");
	var objsLen = "objsLen" + newId(ids, "objsLen");
	var states = [];
	states.push(indent + makeVarState([[pos, "pos"], [objsLen, "objs.length"]]));
	states.push(indent + "$errorMask += 1;\n");
	states.push(this.child.gen(ids, indentLevel));
	states.push(indent + "$errorMask -= 1;\n");
	states.push(indent + "succeed = !succeed;\n");
	//states.push(indent + "if (succeed = !succeed) {\n");
	states.push(addIndent("objs.length = " + objsLen + ";\n" +
												"pos = " + pos + ";\n", indentLevel));
	//states.push(indent + "}\n");
	return states.join("");
}; // エラーロギング !

expressions.mod.prototype.gen = function(ids, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objsLen = "objsLen" + newId(ids, "objsLen");
	var states = [];
	states.push(indent + makeVarState([[objsLen, "objs.length"]]));
	states.push(this.child.gen(ids, indentLevel));
	states.push(indent + "if (succeed) {\n");
	states.push(indent + indentStr + "objs[" + objsLen + "] = " + this.identifier + "(objs[objs.length - 1]);\n");
	states.push(indent + indentStr + "objs.length = " + objsLen + " + 1;\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.rul.prototype.gen = function(ids, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "rule$" + this.ruleSymbol + "();\n");
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
	var writeMatchTable = "if (!$matchTable[pos])\n" +
		indentStr + "$matchTable[pos] = " + stringify(ruleSymbol) + ";\n";
	var deleteMatchTable = "if ($matchTable[pos] === " + stringify(ruleSymbol) + ")\n" +
		indentStr + "$matchTable[pos] = null;\n";

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
		states.push("function rule$" + ruleSymbol + "() {\n");
		states.push(indent + indentStr + "var " + memoKey + " = " + stringify(ruleSymbol + "$") + " + , " + pos1 + " = , " + objs + " = [], undet = 0;\n");
		states.push(addIndent(readMemo, indentLevel + 1));
		states.push(addIndent(writeMatchTable, indentLevel + 1));
		states.push(expression.gen(ids, pass, indentLevel + 1));
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

/*
var key = "r$" + pos;
$readMemo(key);
var pos0 = pos, objs0 = objs, rpos = -1;
undet[pos0] = (undet[pos0] || 0) + 1;
$memo[key] = null;
while (true) {
	pos = pos0;
	objs = [];

	hoge();

	if (!succeed || pos <= rpos)
		break;
	rpos = pos;
	$writeMemo(key, objs);
}
objs = objs0;
$readMemo(key);
if (--undet[pos0] !== 0)
	delete $memo[key];
//*/
var genRule = function(ruleSymbol, expression, indentLevel) {
	var indent = makeIndent(indentLevel);
	var ids = {};
	var key = "key";
	var pos = "pos" + newId(ids, "pos");

	var setMatchTable = "if (!$matchTable[pos])\n" +
		indentStr + "$matchTable[pos] = " + JSON.stringify(ruleSymbol) + ";\n";
	var unsetMatchTable = "if ($matchTable[pos] === " + JSON.stringify(ruleSymbol) + ")\n" +
		indentStr + "$matchTable[pos] = null;\n";

	if (expression.canLeftRecurs(ruleSymbol, []) === 1) { // 左再帰対応
		var objs = "objs" + newId(ids, "objs");

		var states = [];
		states.push("function rule$" + ruleSymbol + "() {\n");
		states.push(indent + indentStr + makeVarState([[key, stringify(ruleSymbol + "$") + " + pos"]]));
		states.push(indent + indentStr + "if ($readMemo(" + key + ")) return;\n");
		states.push(addIndent(setMatchTable, indentLevel + 1));
		states.push(indent + indentStr + makeVarState([[pos, "pos"], [objs, "objs"], ["rpos", "-1"]]));
		states.push(indent + indentStr + "$undet[" + pos + "] = ($undet[" + pos + "] || 0) + 1;\n");
		states.push(indent + indentStr + "$memo[" + key + "] = $failureObj;\n");
		states.push(indent + indentStr + "while (true) {\n");
		states.push(indent + indentStr + indentStr + "pos = " + pos + ";\n");
		states.push(indent + indentStr + indentStr + "objs = [];\n");
		states.push(expression.gen(ids, indentLevel + 2));
		states.push(indent + indentStr + indentStr + "if (!succeed || pos <= rpos)\n");
		states.push(indent + indentStr + indentStr + indentStr + "break;\n");
		states.push(indent + indentStr + indentStr + "rpos = pos;\n");
		states.push(indent + indentStr + indentStr + "$writeMemo(" + key + ", objs);\n");
		states.push(indent + indentStr + "}\n");
		states.push(indent + indentStr + "objs = " + objs + ";\n");
		states.push(indent + indentStr + "$readMemo(" + key + ");\n");
		states.push(indent + indentStr + "if (--$undet[" + pos + "] !== 0)\n");
		states.push(indent + indentStr + indentStr + "delete $memo[" + key + "];\n");
		states.push(addIndent(unsetMatchTable, indentLevel + 1));
		states.push(indent + "}");
		return states.join("");
	} else { // 左再帰非対応
		var objsLen = "objsLen" + newId(ids, "objsLen");

		var states = [];
		states.push("function rule$" + ruleSymbol + "() {\n");
		states.push(indent + indentStr + makeVarState([[key, stringify(ruleSymbol + "$") + " + pos"], [pos, "pos"], [objsLen, "objs.length"]]));
		states.push(indent + indentStr + "if ($readMemo(" + key + ")) return;\n");
		states.push(addIndent(setMatchTable, indentLevel + 1));
		states.push(expression.gen(ids, indentLevel + 1));
		states.push(addIndent(unsetMatchTable, indentLevel + 1));
		states.push(indent + indentStr + "if ($undet[" + pos + "] === 0)\n");
		states.push(indent + indentStr + indentStr + "$writeMemo(" + key + ", objs.slice(" + objsLen + "));\n");
		states.push(indent + "}");
		return states.join("");
	}
};

/*
function rule() {
	var key = "r$" + pos, objsLen = objs.length;
	readMemo(key);

	hoge();

	writeMemo(key, objsLen);
}
//*/

var genjs = function(rules, initializer, exportVariable) {
	for (var r in rules)
		rules[r].prepare(rules);

	var states = [];
	if (exportVariable)
		states.push(exportVariable + " = ");
	states.push("(function() {\n"); // ↓TODO $
	states.push(addIndent('function $parse($input, options) {\n\
	options = options || {};\n\
	var $inputLength = $input.length;\n\
	var pos = 0;\n\
	var objs = [];\n\
	var $undet = new Array($inputLength);\n\
	var succeed = false;\n\
	var $memo = {};\n\
	var $matchTable = new Array($inputLength);\n\
	var $errorMask = 0;\n\
	var $failMatchs = [];\n\
	var $failPos = -1;\n\
	var $failureObj = {};\n\
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
}', 2) + "\n\n");

	states.push(addIndent($joinByOr.toString() + ";", 2) + "\n\n");

	states.push(addIndent('function $readMemo(key) {\n\
	var res = $memo[key];\n\
	if (res !== undefined) {\n\
		if (succeed = res !== $failureObj) {\n\
			pos = res.pos;\n\
			objs.push.apply(objs, res.objs);\n\
		}\n\
		return true;\n\
	}\n\
	return false;\n\
}', 2) + "\n\n");

	states.push(addIndent('function $writeMemo(key, objs) {\n\
	$memo[key] = succeed ? {\n\
		pos: pos,\n\
		objs: objs\n\
	} : $failureObj;\n\
}', 2) + "\n\n");

	states.push(addIndent('	var $ret;\n\
	try {\n\
		rule$start();\n\
	} catch (e) {\n\
		if (e.message === "Infinite loop detected.")\n\
			$ret = {success: false, error: e.message}, succeed = false;\n\
		else\n\
			throw e;\n\
	}\n\
	if (succeed) {\n\
		if (pos === $inputLength)\n\
			$ret = {success: true, content: objs[0]};\n\
		$matchingFail(pos, "end of input");\n\
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
