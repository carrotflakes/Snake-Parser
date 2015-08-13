var expressions = require("./expressions");
var Expression = expressions.Expression;
expressions = expressions.expressions;

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

var makeErrorLogging = function(ptr, match, indentLevel) {
	var matchStr = JSON.stringify(match);
	var indent = makeIndent(indentLevel);
	return indent + "matchingFail(" + ptr + ", " + matchStr + ");\n";
};

expressions.nop.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	return addIndent(pass, indentLevel);
};

expressions.oc.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	if (this.children.length === 1)
		return this.children[0].gen(ptr, objs, ids, pass, fail, indentLevel);
	var indent = makeIndent(indentLevel);
	var ptr1 = "ptr" + newId(ids, "ptr");
	var objs1 = "objs" + newId(ids, "objs");
	var flag = "oc" + newId(ids, "oc");
	var pass1 = flag + " = true;\n";
	var fail1 = flag + " = false;\n";
	var backtrack = objs1 + " = [];\n" + ptr1 + " = " + ptr + ";\n";
	for (var i = this.children.length - 1; 0 <= i; --i) {
		var ids1 = {};
		ids1.__proto__ = ids;
		fail1 = backtrack + this.children[i].gen(ptr1, objs1, ids1, pass1, fail1, 0);
	}
	var states = [];
	states.push(indent + "var " + ptr1 + ", " + objs1 + ", " + flag + ";\n");
	states.push(addIndent(fail1, indentLevel));
	states.push(indent + "if (" + flag + ") {\n");
	states.push(indent + indentStr + ptr + " = " + ptr1  + ";\n");
	states.push(indent + indentStr + objs + ".push.apply(" + objs + ", " + objs1 + ");\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};
/*
var ptr1, objs1, oc1;
ptr1 = ptr0;
objs1 = [];
children[0] の分岐 {
  oc1 = true;
} else {
  ptr1 = ptr0;
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


expressions.seq.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	if (this.children.length === 1)
		return this.children[0].gen(ptr, objs, ids, pass, fail, indentLevel);
	var indent = makeIndent(indentLevel);
	var flag = "seq" + newId(ids, "seq");
	var fail1 = flag + " = false;\n";
	var pass1 = flag + " = true;\n";
	for (var i = this.children.length - 1; 0 <= i; --i)
		pass1 = this.children[i].gen(ptr, objs, ids, pass1, fail1, 0);
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

expressions.rep.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) { // TODO min max によって特殊化
	var indent = makeIndent(indentLevel);
	var ptr1 = "ptr" + newId(ids, "ptr");
	var objs1 = "objs" + newId(ids, "objs");
	var flag = "rep" + newId(ids, "rep");
	var i = "i" + newId(ids, "i");
	var pass1 = ptr + " = " + ptr1 + ";\n" + objs + ".push.apply(" + objs + ", " + objs1 + ");\n";
	if (this.max === Infinity)
		pass1 = "if (" + ptr + " === " + ptr1 + ") throw new Error(\"Infinite loop detected.\");\n" + pass1;
	var fail1;
	if (0 < this.min)
		fail1 = flag + " = " + this.min + " <= " + i + ";\n" + "break " + flag + ";\n";
	else
		fail1 = flag + " = true;\n" + "break " + flag + ";\n";
	var states = [];
	states.push(indent + "var " + ptr1 + ", " + objs1 + ", " + flag + " = true;\n");
	states.push(indent + flag + ":\n");
	if (this.max != Infinity)
		states.push(indent + "for (var " + i + " = 0; " + i + " < " + this.max + "; ++" + i + ") {\n");
	else
		states.push(indent + "for (var " + i + " = 0; ; ++" + i + ") {\n");
	states.push(indent + indentStr + ptr1 + " = " + ptr + ", " + objs1 + " = [];\n");
	states.push(this.child.gen(ptr1, objs1, ids, pass1, fail1, indentLevel + 1));
	states.push(indent + "}\n");
	states.push(indent + "if (" + flag + ") {\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};
/*
var ptr1, objs1, flag = false;
flag:
for (var i = 0; i < this.max; ++i) {
	ptr1 = ptr;
	objs1 = [];
	// child の処理
	if (child の結果) {
		if (ptr === ptr1 && this.max === Infinity)
			throw new InfiniteLoopError();
		ptr0 = ptr1;
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

expressions.str.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	if (this.string.length === 0)
		return addIndent(pass, indentLevel);

	var indent = makeIndent(indentLevel);
	var states = [];
	if (this.string.length !== 1)
		states.push(indent + "if (str.substr(" + ptr + ", " + this.string.length + ") === " + JSON.stringify(this.string) + ") {\n");
	else
		states.push(indent + "if (str.charCodeAt(" + ptr + ") === " + this.string.charCodeAt() + ") {\n");
	states.push(indent + indentStr + ptr + " += " + this.string.length + ";\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging(ptr, JSON.stringify(this.string), indentLevel + 1));
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.cc.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
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
	states.push(indent + "var " + c + " = str.charCodeAt(" + ptr + ");\n");
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
	states.push(indent + indentStr + ptr + " += 1;\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging(ptr, this.makeError(), indentLevel + 1));
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

expressions.ac.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "if (" + ptr + " < strLength) {\n");
	states.push(indent + indentStr + ptr + " += 1;\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging(ptr, ".", indentLevel + 1));
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.obj.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var obj = "obj" + newId(ids, "obj");
	var objectize = "var " + obj + " = {};\n" + "for (var i in " + objs1 + ")\n" + indentStr + obj + "[" + objs1 + "[i].key] = " + objs1 + "[i].value;\n" + objs + ".push(" + obj + ");\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(ptr, objs1, ids, objectize + pass, fail, indentLevel));
	return states.join("");
};

expressions.itm.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var obj = "obj" + newId(ids, "obj");
	var itemize = objs + ".push(" + "{key: " + JSON.stringify(this.key) + ", value: " + objs1 + "[0]}" + ");\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(ptr, objs1, ids, itemize + pass, fail, indentLevel));
	return states.join("");
};

expressions.ci.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + objs + ".push({key: " + JSON.stringify(this.key) + ", value: " + JSON.stringify(this.value) + "});\n");
	states.push(addIndent(pass, indentLevel));
	return states.join("");
};

expressions.arr.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var arraying = objs + ".push(" + objs1 + ");\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(ptr, objs1, ids, arraying + pass, fail, indentLevel));
	return states.join("");
};

expressions.tkn.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var ptr1 = "ptr" + newId(ids, "ptr");
	var tokenize = objs + ".push(str.substring(" + ptr + ", " + ptr1 + "));\n" + ptr + " = " + ptr1 + ";\n";
	var states = [];
	states.push(indent + "var " + ptr1 + " = " + ptr + ";\n");
	states.push(this.child.gen(ptr1, objs, ids, tokenize + pass, fail, indentLevel));
	return states.join("");
};

expressions.ltr.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var states = [];
	states.push(makeIndent(indentLevel) + objs + ".push(" + JSON.stringify(this.value) + ");\n");
	states.push(addIndent(pass, indentLevel));
	return states.join("");
};

expressions.pla.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var ptr1 = "ptr" + newId(ids, "ptr");
	var objs1 = "objs" + newId(ids, "objs");
	var uem = "errorMask -= 1;\n";
	var backtrack = objs1 + " = [];\n" + ptr1 + " = " + ptr + ";\n";
	var states = [];
	states.push(indent + "var " + ptr1 + " = " + ptr + ", " + objs1 + " = [];\n");
	states.push(indent + "errorMask += 1;\n");
	states.push(this.child.gen(ptr1, objs1, ids, uem + backtrack + pass, uem + fail, indentLevel));
	return states.join("");
};

expressions.nla.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var ptr1 = "ptr" + newId(ids, "ptr");
	var objs1 = "objs" + newId(ids, "objs");
	var uem = "errorMask -= 1;\n";
	var backtrack = objs1 + " = [];\n" + ptr1 + " = " + ptr + ";\n";
	var states = [];
	states.push(indent + "var " + ptr1 + " = " + ptr + ", " + objs1 + " = [];\n");
	states.push(indent + "errorMask += 1;\n");
	states.push(this.child.gen(ptr1, objs1, ids, uem + fail, uem + backtrack + pass, indentLevel));
	return states.join("");
}; // エラーロギング !

expressions.mod.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objs1 = "objs" + newId(ids, "objs");
	var modify;
	if (typeof(this.modifierSymbolOrFunction) === "string")
		modify = objs + ".push(mod$" + this.modifierSymbolOrFunction + "(" + objs1 + "[0]));\n";
	else
		modify = objs + ".push((" + this.modifierSymbolOrFunction.toString() + ")(" + objs1 + "[0]));\n";
	var states = [];
	states.push(indent + "var " + objs1 + " = [];\n");
	states.push(this.child.gen(ptr, objs1, ids, modify + pass, fail, indentLevel));
	return states.join("");
};

expressions.rul.prototype.gen = function(ptr, objs, ids, pass, fail, indentLevel) {
	var indent = makeIndent(indentLevel);
	var mr = "mr" + newId(ids, "mr");
	var states = [];
	states.push(indent + "var " + mr + " = rule$" + this.ruleSymbol + "(" + ptr + ");\n");
	states.push(indent + "if (" + mr + " instanceof Object) {\n");
	states.push(indent + indentStr + ptr + " = " + mr + ".pointer;\n");
	states.push(indent + indentStr + objs + ".push.apply(" + objs + ", " + mr + ".objects);\n");
	states.push(indent + indentStr + "undet += " + mr + ".undeterminate;\n");
	states.push(addIndent(pass, indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(indent + indentStr + "undet += " + mr + ";\n");
	states.push(addIndent(fail, indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

/*
// メモ化なし
var genRule = function(ruleSymbol, expression, indentLevel) {
	var ids = {};
	var objs = "objs";
	var ptr = "ptr";
	var pass = "return {objects: " + objs + ", pointer: " + ptr + ", undeterminate: undet};\n";
	var fail = "return undet;\n";
	var states = [];
	states.push("function(" + ptr + ") {\n");
	states.push(makeIndent(indentLevel + 1) + "var " + objs + " = [], undet = 0;\n");
	states.push(expression.gen(ptr, objs, ids, pass, fail, indentLevel + 1));
	states.push(makeIndent(indentLevel) + "}");
	return states.join("");
};
//*/

/*
if (!matchTable[])
	matchTable[] = ruleSymbol;

if (matchTable[] === ruleSymbol)
	matchTable = null;*/
// メモ化あり
//*
var genRule = function(ruleSymbol, expression, indentLevel) {
	var indent = makeIndent(indentLevel);
	var ids = {};
	var ptr = "ptr";
	var objs = "objs";
	var memoKey = "key";
	var readMemo = "if (" + memoKey + " in memo)\n" +
		indentStr + indentStr + "return memo[" + memoKey + "];\n";
	var writeMatchTable = "if (!matchTable[" + ptr + "])\n" +
		indentStr + "matchTable[" + ptr + "] = " + JSON.stringify(ruleSymbol) + ";\n";
	var deleteMatchTable = "if (matchTable[" + ptr + "] === " + JSON.stringify(ruleSymbol) + ")\n" +
		indentStr + "matchTable[" + ptr + "] = null;\n";

	if (expression.isLeftRecursion(ruleSymbol, []) === 1) { // 左再帰対応
		var ptr1 = "ptr" + newId(ids, "ptr");
		var obj1 = "obj" + newId(ids, "obj");
		var fail = deleteMatchTable +
			"var " + obj1 + " = memo[" + memoKey + "];\n" +
			"if (" + obj1 + " instanceof Object)\n" +
			indentStr + "undet = " + obj1 + ".undeterminate -= 1;\n" +
			"else\n" +
			indentStr + "undet = " + obj1 + " -= 1;\n" +
			"if (0 === undet)\n" +
			indentStr + "memo[" + memoKey + "] = " + obj1 + ";\n" +
			"else\n" +
			indentStr + "delete memo[" + memoKey + "];\n" +
			"return " + obj1 + ";\n";
		var pass = "if (" + ptr1 + " <= rptr) {\n" +
			addIndent(fail, 1) +
			"}\n" +
			"rptr = " + ptr1 + ";\n" +
			"memo[" + memoKey + "] = {objects: " + objs + ", pointer: " + ptr1 + ", undeterminate: undet};\n" +
			"continue rec;\n";
		var states = [];
		states.push("function(" + ptr + ") {\n");
		states.push(indent + indentStr + "var " + memoKey + " = " + JSON.stringify(ruleSymbol + "$") + " + " + ptr + ", " + ptr1 + ", rptr = -1, " + objs + " = [], undet = 0;\n");
		states.push(addIndent(readMemo, indentLevel + 1));
		states.push(addIndent(writeMatchTable, indentLevel + 1));
		states.push(indent + indentStr + "memo[" + memoKey + "] = false;\n");
		states.push("rec:");
		states.push(indent + indentStr + "while (true) {\n");
		states.push(indent + indentStr + indentStr + "undet = 0; " + ptr1 + " = ptr; " + objs + " = [];\n");
		states.push(expression.gen(ptr1, objs, ids, pass, fail, indentLevel + 2));
		states.push(indent + indentStr + "}\n");
		states.push(indent + "}");
		return states.join("");
	} else { // 左再帰非対応
		var ptr1 = "ptr" + newId(ids, "ptr");
		var obj1 = "obj" + newId(ids, "obj");
		var pass = deleteMatchTable +
			"var " + obj1 + " = {objects: " + objs + ", pointer: " + ptr1 + ", undeterminate: undet};\n" +
			"if (undet === 0)\n" +
			indentStr + "memo[" + memoKey + "] = " + obj1 + ";\n" +
			"return " + obj1 + ";\n";
		var fail = deleteMatchTable +
			"if (undet === 0)\n" +
			indentStr + "memo[" + memoKey + "] = undet;\n" +
			"return undet;\n";
		var states = [];
		states.push("function(" + ptr + ") {\n");
		states.push(indent + indentStr + "var " + memoKey + " = " + JSON.stringify(ruleSymbol + "$") + " + " + ptr + ", " + ptr1 + " = " + ptr + ", " + objs + " = [], undet = 0;\n");
		states.push(addIndent(readMemo, indentLevel + 1));
		states.push(addIndent(writeMatchTable, indentLevel + 1));
		states.push(expression.gen(ptr1, objs, ids, pass, fail, indentLevel + 1));
		states.push(indent + "}");
		return states.join("");
	}
};//*/

/*
if (key in memo) return memo[key];
rptr = -1;
memo[key] = false;
rec:
while (true) {
	det = true;
	ptr1 = ptr;
	objs = [];

	hogeeeeeee;

	if (ptr1 <= rptr) {//終わり
		return {hoge:hoge, determinate: det};
	}
	rptr = ptr1;
	memo[key] = {hoge:hoge, determinate: false};
	continue rec;
	// failなら・・memoを返す detをtrueにしてね。
}
//*/

var genjs = function(parser) {
	var states = [];
	states.push("(function() {\n" + indentStr + "var str, strLength, memo, matchTable, errorMask, failMatchs, failPtr;\n\n");
	// rules
	for (var key in parser.rules) {
		states.push(indentStr + "var rule$" + key + " = " + genRule(key, parser.rules[key], 1) + ";\n\n");
	}
	// modifiers
	for (var key in parser.modifier) {
		states.push(indentStr + "var mod$" + key + " = " + parser.modifier[key].toString() + ";\n\n");
	}

	states.push(addIndent('var matchingFail = function(ptr, match) {\n\
	if (errorMask === 0 && failPtr <= ptr) {\n\
		match = matchTable[ptr] ? matchTable[ptr] : match;\n\
		if (failPtr === ptr) {\n\
			if (failMatchs.indexOf(match) === -1)\n\
				failMatchs.push(match);\n\
		} else {\n\
			failMatchs = [match];\n\
			failPtr = ptr;\n\
		}\n\
	}\n\
};', 1) + "\n\n");

	states.push(addIndent("var joinByOr = " + joinByOr.toString() + ";", 1) + "\n\n");

	states.push(addIndent('var $parse = function(string) {\n\
	str = string;\n\
	strLength = string.length;\n\
	memo = {};\n\
	matchTable = new Array(strLength);\n\
	errorMask = 0;\n\
	failMatchs = [];\n\
	failPtr = -1;\n\
	var ret;\n\
	try {\n\
		var mr = rule$start(0);\n\
	} catch (e) {\n\
		if (e.message === "Infinite loop detected.")\n\
			ret = {success: false, error: e.message}; \n\
		else\n\
			throw e;\n\
	}\n\
	if (mr instanceof Object) {\n\
		if (mr.pointer === strLength)\n\
			ret = {success: true, content: mr.objects[0]};\n\
		matchingFail(mr.pointer, "end of input");\n\
	}\n\
	if (!ret) {\n\
		var line = (str.slice(0, failPtr).match(/\\n/g) || []).length;\n\
		var column = failPtr - str.lastIndexOf("\\n", failPtr - 1) - 1;\n\
		ret = {success: false, error: "Line " + line + ", column " + column + ": Expected " + failMatchs.join(", ") + " but " + (JSON.stringify(str[failPtr]) || "end of input") + " found."};\n\
	}\n\
	str = memo = matchTable = undefined;\n\
	return ret;\n\
};\n', 1)); // Line , column : Expected  but  found.
	states.push(indentStr + "return $parse;\n");
	states.push("})();\n");
	return states.join("");
};

var joinByOr = function(strs) {
	if (strs.length === 0)
		return "";
	if (strs.length === 1)
		return strs[0];
	return strs.slice(0, strs.length - 1).join(", ") + " or " + strs[strs.length - 1];
};

module.exports = genjs;
