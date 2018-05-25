var expressions = require("./expressions");
var ruleOptimize = require("./optimize");
var jsLiteralify = require("./jsLiteralify");

var indentStr = "\t";

var makeIndent = function(level) {
	return new Array(level + 1).join(indentStr);
};

var addIndent = function(str, level) {
	if (str === "")
		return str;
	var indent = makeIndent(level);
	return indent + str.replace(/\n(?!$)/g, "\n" + indent);
};

var newId = function(ids, name) {
	if (name in ids)
		return name + ++ids[name];
	else
		return name + (ids[name] = 0);
};

var makeVarState = function(vs, indentLevel) {
	vs = vs.filter(function(v) {
		if (v instanceof Object)
			return v[0];
		else
			return v;
	});
	vs = vs.map(function(v) {
		if (v instanceof Object)
			return v[0] + (v[1] ? " = " + v[1] : "");
		else
			return v;
	});
	if (vs.length)
		return makeIndent(indentLevel) + "var " + vs.join(", ") + ";\n";
	else
		return "";
};

var stringEscape = function(str) {
	return str
		.replace(/\\/g,		"\\\\")
		.replace(/"/g,		"\\\"")
		.replace(/\x08/g, "\\b")
		.replace(/\t/g,		"\\t")
		.replace(/\n/g,		"\\n")
		.replace(/\f/g,		"\\f")
		.replace(/\r/g,		"\\r")
    .replace(/[\x00-\x07\x0B\x0E\x0F\x10-\x1F\x80-\xFF]/g, function(c) {
			return "\\x" + ("0" + c.charCodeAt().toString(16)).slice(-2);
		})
    .replace(/[\u0100-\uFFFF]/g, function(c) {
			return "\\u" + ("000" + c.charCodeAt().toString(16)).slice(-4);
		});
};

var charCodeToRegexpClassChar = function(cc) {
	switch (cc) {
	case 92: // backslash
	case 47: // slash
	case 93: // closing bracket
	case 94: // caret
	case 45: // dash
		return "\\" + String.fromCharCode(cc);
	case 0: // null
		return "\\0";
	case 9: // horizontal tab
		return "\\t";
	case 10: // line feed
		return "\\n";
	case 11: // vertical tab
		return "\\v";
	case 12: // form feed
		return "\\f";
	case 13: // carriage return
		return "\\r";
	}
	if (0x00 <= cc && cc <= 0x08 || cc === 0x0e || cc === 0x0f || 0x10 <= cc && cc <= 0x1f || 0x80 <= cc && cc <= 0xFF)
		return "\\x" + ("0" + cc.toString(16)).slice(-2);
	if (0x100 <= cc && cc <= 0xffff)
		return "\\u" + ("000" + cc.toString(16)).slice(-4);
	return String.fromCharCode(cc);
};

var makeErrorLogging = function(match, indentLevel) {
	var matchStr = '"' + stringEscape(match) + '"';
	var indent = makeIndent(indentLevel);
	return indent + "$matchingFail(" + matchStr + ");\n";
};

expressions.nop.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	return "";
};

expressions.fl.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	return makeIndent(indentLevel) + "$pos = -1;\n";
};

expressions.oc.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	if (this.children.length === 1)
		return this.children[0].gen(ids, pos, objsLen, indentLevel);
	var indent = makeIndent(indentLevel);
	var posV, objsLenV;
	pos = pos || (posV = newId(ids, "pos"));
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));

	var states = [];
	states.push(makeVarState([[posV, "$pos"], [objsLenV, "$objsLen"]], indentLevel));
	var ids1 = {}; ids1.__proto__ = ids;
	states.push(this.children[0].gen(ids1, pos, objsLen, indentLevel));
	var nest = 0;
	for (var i = 1; i < this.children.length; ++i) {
		states.push(makeIndent(indentLevel + nest++) + "if ($pos === -1) {\n");
		states.push(makeIndent(indentLevel + nest) + "$pos = " + pos + ";\n");
		states.push(makeIndent(indentLevel + nest) + "$objsLen = " + objsLen + ";\n");
		var ids1 = {}; ids1.__proto__ = ids;
		states.push(this.children[i].gen(ids1, pos, objsLen, indentLevel + nest));
	}
	while (nest)
		states.push(makeIndent(indentLevel + --nest) + "}\n");
	return states.join("");
};


expressions.seq.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	if (this.children.length === 1)
		return this.children[0].gen(ids, pos, objsLen, indentLevel);
	var indent = makeIndent(indentLevel);
	var states = [];
	var ids1 = {}; ids1.__proto__ = ids;
	var checkSuccess = false;
	var nest = 0;
	for (var i = 0; i < this.children.length; ++i) {
		var ids1 = {}; ids1.__proto__ = ids;
		if (checkSuccess)
			states.push(makeIndent(indentLevel + nest++) + "if ($pos !== -1) {\n");
		states.push(this.children[i].gen(ids1, pos, objsLen, indentLevel + nest));
		if (!this.children[i].neverAdvance)
			pos = null;
		if (!this.children[i].neverProduce)
			objsLen = null;
		checkSuccess = !this.children[i].alwaysSuccess;
	}
	while (nest)
		states.push(makeIndent(indentLevel + --nest) + "}\n");
	return states.join("");
};

expressions.rep.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	if (this.min === 0 && this.max === 1) {
		var posV, objsLenV;
		pos = pos || (posV = newId(ids, "pos"));
		objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));

		var states = [];
		states.push(makeVarState([[posV, "$pos"], [objsLenV, "$objsLen"]], indentLevel));
		states.push(this.child.gen(ids, pos, objsLen, indentLevel));
		states.push(indent + "if ($pos === -1) {\n");
		states.push(indent + indentStr + "$pos = " + pos + ";\n");
		states.push(indent + indentStr + "$objsLen = " + objsLen + ";\n");
		states.push(indent + "}\n");
		return states.join("");
	} else {
		pos = newId(ids, "pos");
		objsLen = newId(ids, "objsLen");
		var i = newId(ids, "i");

		var states = [];
		states.push(makeVarState([[pos, "$pos"], [objsLen, "$objsLen"]], indentLevel));
		if (this.max != Infinity) {
			states.push(indent + "for (var " + i + " = 0; " + i + " < " + this.max + "; " + i + "++) {\n");
		} else if (0 < this.min) {
			states.push(indent + "for (var " + i + " = 0; ; " + i + "++) {\n");
		} else {
			states.push(indent + "while (true) {\n");
		}
		states.push(this.child.gen(ids, pos, objsLen, indentLevel + 1));
		states.push(indent + indentStr + "if ($pos !== -1) {\n");
		if (this.possibleInfiniteLoop) {
			states.push(indent + indentStr + indentStr + "if ($pos === " + pos + ") {\n");
			states.push(indent + indentStr + indentStr + indentStr + "throw new Error(\"Infinite loop detected.\");\n");
			states.push(indent + indentStr + indentStr + "}\n");
		}
		states.push(indent + indentStr + indentStr + pos + " = $pos;\n");
		states.push(indent + indentStr + indentStr + objsLen + " = $objsLen;\n");
		states.push(indent + indentStr + "} else {\n");
		states.push(indent + indentStr + indentStr + "break;\n");
		states.push(indent + indentStr + "}\n");
		states.push(indent + "}\n");
		states.push(indent + "$pos = " + pos + ";\n");
		states.push(indent + "$objsLen = " + objsLen + ";\n");
		if (0 < this.min) {
			states.push(indent + "if (" + i + " < " + this.min + ") {\n");
			states.push(indent + indentStr + "$pos = -1;\n");
			states.push(indent + "}\n");
		}
		return states.join("");
	}
};


expressions.str.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	if (this.string.length === 0)
		return "";

	var indent = makeIndent(indentLevel);
	var states = [];
	if (this.string.length !== 1)
		states.push(indent + "if ($input.substr($pos, " + this.string.length + ") === " + jsLiteralify(this.string) + ") {\n");
	else
		states.push(indent + "if ($input.charCodeAt($pos) === " + this.string.charCodeAt() + ") {\n");
	states.push(indent + indentStr + "$pos += " + this.string.length + ";\n");
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging(jsLiteralify(this.string), indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.cc.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	if (this.characterClass.length < 4) { // 適当
		var c = "c";
		states.push(indent + "var " + c + " = $input.charCodeAt($pos);\n");
		states.push(indent + "if (" + this.makeCondition(c) + ") {\n");
	} else {
		states.push(indent + "if (/" + this.makeRegexp() + "/.test($input.charAt($pos))) {\n");
	}
	states.push(indent + indentStr + "$pos += 1;\n");
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging(this.makeRegexp(), indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.cc.prototype.makeCondition = function(c) {
	var conds = [];
	if (!this.invert) {
		for (var i in this.characterClass) {
			var cc = this.characterClass[i];
			if (cc.type === "range")
				conds.push(cc.start + " <= " + c + " && " + c + " <= " + cc.end);
			else
				conds.push(c + " === " + cc.char);
		}
		return conds.length === 0 ? "false" : conds.join(" || ");
	} else {
		for (var i in this.characterClass) {
			var cc = this.characterClass[i];
			if (cc.type === "range")
				conds.push("(" + c + " < " + cc.start + " || " + cc.end + " < " + c + ")");
			else
				conds.push(c + " !== " + cc.char);
		}
		return conds.length === 0 ? true : "!isNaN(" + c + ") && " + conds.join(" && ");
	}
};

expressions.cc.prototype.makeRegexp = function() {
	return (this.invert ? "[^" : "[") + this.characterClass.map(
		function(x) {
			if (x.type == "range")
				return charCodeToRegexpClassChar(x.start) + "-" + charCodeToRegexpClassChar(x.end);
			else
				return charCodeToRegexpClassChar(x.char);
		}).join("") + "]";
};

expressions.ac.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "if ($pos < $inputLength) {\n");
	states.push(indent + indentStr + "$pos += 1;\n");
	states.push(indent + "} else {\n");
	states.push(makeErrorLogging(".", indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.obj.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objsLenV;
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var obj = newId(ids, "obj");
	var states = [];
	states.push(makeVarState([[objsLenV, "$objsLen"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "if ($pos !== -1) {\n");
	states.push(indent + indentStr + "var " + obj + " = {};\n");
	states.push(indent + indentStr + "for (var i = " + objsLen + "; i < $objsLen; i += 2)\n");
	states.push(indent + indentStr + indentStr + obj + "[$objs[i + 1]] = $objs[i];\n");
	states.push(indent + indentStr + "$objsLen = " + objsLen + " + 1;\n");
	states.push(indent + indentStr + "$objs[" + objsLen + "] = " + obj + ";\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.pr.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	if (this.child instanceof expressions.ltr) {
		var states = [];
		states.push(indent + "$objs[$objsLen++] = " + jsLiteralify(this.child.value) + ";\n");
		states.push(indent + "$objs[$objsLen++] = " + jsLiteralify(this.key) + ";\n");
		return states.join("");
	} else {
		var objsLenV;
		objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
		var states = [];
		states.push(makeVarState([[objsLenV, "$objsLen"]], indentLevel));
		states.push(this.child.gen(ids, pos, objsLen, indentLevel));
		states.push(indent + "if ($pos !== -1) {\n");
		states.push(indent + indentStr + "if ($objsLen === " + objsLen + ")\n");
		states.push(indent + indentStr + indentStr + "$objs[" + objsLen + "] = undefined;\n");
		states.push(indent + indentStr + "$objs[" + objsLen + " + 1] = " + jsLiteralify(this.key) + ";\n");
		states.push(indent + indentStr + "$objsLen = " + objsLen + " + 2;\n");
		states.push(indent + "}\n");
		return states.join("");
	}
};

expressions.arr.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objsLenV;
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var states = [];
	states.push(makeVarState([[objsLenV, "$objsLen"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "if ($pos !== -1) {\n");
	states.push(indent + indentStr + "$objs[" + objsLen + "] = $objs.slice(" + objsLen + ", $objsLen);\n");
	states.push(indent + indentStr + "$objsLen = " + objsLen + " + 1;\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.tkn.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var posV;
	pos = pos || (posV = newId(ids, "pos"));
	var states = [];
	states.push(makeVarState([[posV, "$pos"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "if ($pos !== -1) {\n");
	if (this.product !== undefined)
		states.push(indent + indentStr + "$objs[$objsLen++] = " + jsLiteralify(this.product) + ";\n");
	else
		states.push(indent + indentStr + "$objs[$objsLen++] = $input.substring(" + pos + ", $pos);\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.ltr.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "$objs[$objsLen++] = " + jsLiteralify(this.value) + ";\n");
	return states.join("");
};

expressions.cv.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var states = [];
	switch (this.variable) {
	case "input":
		states.push(indent + "$objs[$objsLen++] = $input;\n");
		break;
	case "pos":
		states.push(indent + "$objs[$objsLen++] = $pos;\n");
		break;
	case "row":
		states.push(indent + "$objs[$objsLen++] = ($input.slice(0, $pos).match(/\\r\\n|\\r|\\n/g) || []).length;\n");
		break;
	case "column":
		states.push(indent + '$objs[$objsLen++] = $pos - Math.max($input.lastIndexOf("\\r", $pos - 1), $input.lastIndexOf("\\n", $pos - 1));\n');
		break;
	}

	return states.join("");
};

expressions.pla.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var posV, objsLenV;
	pos = pos || (posV = newId(ids, "pos"));
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var states = [];
	states.push(makeVarState([[posV, "$pos"], [objsLenV, "$objsLen"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "if ($pos !== -1) {\n");
	states.push(addIndent("$objsLen = " + objsLen + ";\n" +
												"$pos = " + pos + ";\n", indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

expressions.nla.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var posV, objsLenV;
	pos = pos || (posV = newId(ids, "pos"));
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var states = [];
	states.push(makeVarState([[posV, "$pos"], [objsLenV, "$objsLen"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "if ($pos === -1) {\n");
	states.push(addIndent("$objsLen = " + objsLen + ";\n" +
												"$pos = " + pos + ";\n", indentLevel + 1));
	states.push(indent + "} else {\n");
	states.push(indent + indentStr + "$pos = -1;\n");
	states.push(indent + "}\n");
	return states.join("");
}; // エラーロギング !

expressions.mod.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objsLenV;
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var states = [];
	states.push(makeVarState([[objsLenV, "$objsLen"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "if ($pos !== -1) {\n");
	states.push(indent + indentStr + "$objs[" + objsLen + "] = " + resolveIdentifier(this) + "($objs[" + objsLen + "]);\n");
	states.push(indent + indentStr + "$objsLen = " + objsLen + " + 1;\n");
	states.push(indent + "}\n");
	return states.join("");
};

expressions.grd.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var posV, objsLenV;
	pos = pos || (posV = newId(ids, "pos"));
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var states = [];
	states.push(makeVarState([[objsLenV, "$objsLen"], [posV, "$pos"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "if ($pos !== -1 && !" + resolveIdentifier(this) + "($objs[" + objsLen + "])) {\n");
	states.push(indent + indentStr + "$pos = " + pos + ";\n");
	states.push(makeErrorLogging("a guarded expression", indentLevel + 1));
	states.push(indent + "}\n");
	return states.join("");
};

function resolveIdentifier(exp) {
  if (exp.identifier) {
    return exp.identifier;
  } else {
    return resolveIdentifier(exp.identifierPlaceholder);
  }
}

expressions.wst.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	var indent = makeIndent(indentLevel);
	var objsLenV;
	objsLen = objsLen || (objsLenV = newId(ids, "objsLen"));
	var states = [];
	states.push(makeVarState([[objsLenV, "$objsLen"]], indentLevel));
	states.push(this.child.gen(ids, pos, objsLen, indentLevel));
	states.push(indent + "$objsLen = " + objsLen + ";\n");
	return states.join("");
};

expressions.rul.prototype.gen = function(ids, pos, objsLen, indentLevel) {
	if (this.arguments && this.rule) { // 引数付きルールの呼び出し
		return this.body.gen(ids, pos, objsLen, indentLevel);
	}
	var indent = makeIndent(indentLevel);
	var states = [];
	states.push(indent + "rule$" + this.ruleIdent + "();\n");
	return states.join("");
};

var genRule = function(rule, memoRules, useUndet, indentLevel) {
	var indent = makeIndent(indentLevel);
	var ids = {};
	var key = "key";
	var keyValue = "$pos * " + memoRules.length + " + " + memoRules.indexOf(rule.ident);
	if (memoRules.indexOf(rule.ident) === -1)
		key = null;
	var pos = newId(ids, "pos");

	var setMatchTable = "";
	var unsetMatchTable = "";
	if (rule.name) {
		setMatchTable = "if (!$matchTable[" + pos + "]) {\n" +
			indentStr + "$matchTable[" + pos + "] = " + jsLiteralify(rule.name) + ";\n" +
			"}\n";
		unsetMatchTable = "if ($matchTable[" + pos + "] === " + jsLiteralify(rule.name) + ") {\n" +
			indentStr + "$matchTable[" + pos + "] = null;\n" +
			"}\n";
	}

	if (rule.leftRecurs) { // 左再帰対応
		var objs = newId(ids, "objs");

		var states = [];
		states.push("function rule$" + rule.ident + "() {\n");
		states.push(makeVarState([[key, keyValue]], indentLevel + 1));
		states.push(indent + indentStr + "if ($readMemo(" + key + ")){\n");
		states.push(indent + indentStr + indentStr + "return;\n");
		states.push(indent + indentStr + "}\n");
		states.push(addIndent(setMatchTable, indentLevel + 1));
		states.push(indent + indentStr + "$objs.length = $objsLen;\n");
		states.push(makeVarState([[pos, "$pos"], [objs, "$objs"], ["rpos", "-1"]], indentLevel + 1));
		states.push(indent + indentStr + "$undet[" + pos + "] = ($undet[" + pos + "] || 0) + 1;\n");
		states.push(indent + indentStr + "$memo[" + key + "] = $failureObj;\n");
		states.push(indent + indentStr + "while (true) {\n");
		states.push(indent + indentStr + indentStr + "$pos = " + pos + ";\n");
		states.push(indent + indentStr + indentStr + "$objs = [];\n");
		states.push(indent + indentStr + indentStr + "$objsLen = 0;\n");
		states.push(rule.body.gen(ids, pos, "0", indentLevel + 2));
		states.push(indent + indentStr + indentStr + "if ($pos === -1 || $pos <= rpos) {\n");
		states.push(indent + indentStr + indentStr + indentStr + "break;\n");
		states.push(indent + indentStr + indentStr + "}\n");
		states.push(indent + indentStr + indentStr + "rpos = $pos;\n");
		states.push(indent + indentStr + indentStr + "$objs.length = $objsLen;\n");
		states.push(indent + indentStr + indentStr + "$writeMemo(" + key + ", $pos !== -1 && $objs);\n");
		states.push(indent + indentStr + "}\n");
		states.push(indent + indentStr + "$objs = " + objs + ";\n");
		states.push(indent + indentStr + "$objsLen = $objs.length;\n");
		states.push(indent + indentStr + "$readMemo(" + key + ");\n");
		states.push(indent + indentStr + "if (--$undet[" + pos + "]) {\n");
		states.push(indent + indentStr + indentStr + "delete $memo[" + key + "];\n");
		states.push(indent + indentStr + "}\n");
		states.push(addIndent(unsetMatchTable, indentLevel + 1));
		states.push(indent + "}");
		return states.join("");
	} else { // 左再帰非対応
		var objsLen = newId(ids, "objsLen");

		var states = [];
		states.push("function rule$" + rule.ident + "() {\n");
		states.push(makeVarState([[key, keyValue], [pos, "$pos"], [objsLen, "$objsLen"]], indentLevel + 1));
		if (key) {
			states.push(indent + indentStr + "if ($readMemo(" + key + ")) {\n");
			states.push(indent + indentStr + indentStr + "return;\n");
			states.push(indent + indentStr + "}\n");
		}
		states.push(addIndent(setMatchTable, indentLevel + 1));
		states.push(rule.body.gen(ids, pos, objsLen, indentLevel + 1));
		states.push(addIndent(unsetMatchTable, indentLevel + 1));
		if (key) {
			if (useUndet) {
				states.push(indent + indentStr + "if (!$undet[" + pos + "]) {\n");
				states.push(indent + indentStr + indentStr + "$writeMemo(" + key + ", $pos !== -1 && $objs.slice(" + objsLen + ", $objsLen));\n");
				states.push(indent + indentStr + "}\n");
			} else {
				states.push(indent + indentStr + "$writeMemo(" + key + ", $pos !== -1 && $objs.slice(" + objsLen + ", $objsLen));\n");
			}
		}
		states.push(indent + "}");
		return states.join("");
	}
};

var genjs = function(rules, initializer, options) {
	options = options || {};

	for (var s in rules) {
		if (rules[s].parameters) { // 引数付きルール
			var shadowedRules = {};
			shadowedRules.__proto__ = rules;
			for (var j in rules[s].parameters)
				shadowedRules[rules[s].parameters[j]] = "argument";

			rules[s].body.prepare(shadowedRules);
		} else {
			rules[s].body.prepare(rules);
		}
	}

	// 再帰している引数付きルールを見つける
	for (var s in rules) {
		if (rules[s].parameters && rules[s].body.isRecursive(s, []))
			rules[s].recursive = true;
	}

	// 引数付きでないルールの展開
	for (var s in rules) {
		if (!rules[s].parameters)
			rules[s].body.expand({});
	}

	// 再帰している引数付きルールの特殊化
	var reduceds = [];
	for (var s in rules)
		if (rules[s].recursive)
			[].push.apply(reduceds, rules[s].reduceds);
	for (var i in reduceds) {
		rules[reduceds[i].ruleIdent] = {
			ident: reduceds[i].ruleIdent,
			body: reduceds[i].body,
			referenceCount: 1, //?
		};
	}

	var useUndet = false;
	for (var s in rules) {
		if (!rules[s].parameters) { // 引数なしルール
			var b = rules[s].body.canLeftRecurs(rules[s].ident, []) === 1;
			rules[s].leftRecurs = b;
			useUndet = useUndet || b;
		}
	}

	var memoRules = [];
	for (var s in rules) {
		if (!rules[s].parameters) { // 引数なしルール
			if (rules[s].referenceCount)
				memoRules.push(s);
		}
	}

	var states = [];
	states.push("(function() {\n");
	states.push(indentStr + "\"use strict\";\n");
	states.push(addIndent(sign, 1));
	states.push("\n");
	states.push(indentStr + 'function $parse($input, options) {\n');
	states.push(addIndent('options = options || {};\n\
var $inputLength = $input.length;\n\
var $pos = 0;\n\
var $objs = [];\n\
var $objsLen = 0;\n\
var $memo = [];\n\
var $matchTable = new Array($inputLength);\n\
var $failMatchs = [];\n\
var $failPos = 0;\n\
var $failureObj = {};\n\
', 2));
	if (useUndet)
		states.push(indentStr + indentStr + "var $undet = new Array($inputLength);\n");

	// initializer
	states.push(initializer);
	states.push("\n\n");

	// modifiers and guards
	var functions = {};
	var functionId = 0;
	for (var r in rules) {
		rules[r].body.traverse(function(expr) {
			if (expr instanceof expressions.mod || expr instanceof expressions.grd) {
				if (!expr.identifier) {
					if (!functions[expr.code]) {
						functions[expr.code] = expr.identifier = "func$" + functionId++;
						states.push(makeIndent(2) + "function " + expr.identifier + "($) {" + expr.code + "}" + "\n\n");
					} else {
						expr.identifier = functions[expr.code];
					}
				}
			}
		});
	}

	// rules
	for (var key in rules) {
		if (!rules[key].parameters) {
			ruleOptimize(rules[key]);
			states.push(makeIndent(2) + genRule(rules[key], memoRules, useUndet, 2) + "\n\n");
		}
	}

	states.push(addIndent('function $matchingFail(match) {\n\
	if ($failPos <= $pos) {\n\
		match = $matchTable[$pos] ? $matchTable[$pos] : match;\n\
		if ($failPos === $pos) {\n\
			$failMatchs.push(match);\n\
		} else {\n\
			$failMatchs.length = 0;\n\
			$failMatchs[0] = match;\n\
			$failPos = $pos;\n\
		}\n\
	}\n\
	$pos = -1;\n\
}', 2) + "\n\n");

	states.push(addIndent($joinWithOr.toString(), 2) + "\n\n");

	states.push(addIndent('function $readMemo(key) {\n\
	var res = $memo[key];\n\
	if (res !== undefined) {\n\
		if (res !== $failureObj) {\n\
			$pos = res.pos;\n\
			for (var i = 0, il = res.objs.length; i < il; ++i) {\n\
				$objs[$objsLen++] = res.objs[i];\n\
			}\n\
		} else {\n\
			$pos = -1;\n\
		}\n\
		return true;\n\
	}\n\
	return false;\n\
}', 2) + "\n\n");

	states.push(addIndent('function $writeMemo(key, objs) {\n\
	$memo[key] = objs ? {\n\
		pos: $pos,\n\
		objs: objs\n\
	} : $failureObj;\n\
}', 2) + "\n\n");

	states.push(addIndent('	rule$start();\n\
	if ($pos !== -1) {\n\
		if ($pos === $inputLength) {\n\
			$objs.length = $objsLen;\n\
			return $objs[0];\n\
		}\n\
		$matchingFail("end of input");\n\
	}\n\
	if ($failMatchs.length === 0) {\n\
		$failMatchs.push("something");\n\
	}\n\
	$failMatchs = $failMatchs.filter(function (x, i, self) {\n\
		return self.indexOf(x) === i;\n\
	});\n\
	var $line = ($input.slice(0, $failPos).match(/\\r\\n|\\r|\\n/g) || []).length;\n\
	var $column = $failPos - Math.max($input.lastIndexOf("\\r", $failPos - 1), $input.lastIndexOf("\\n", $failPos - 1));\n\
	var $errorMessage = "Line " + ($line + 1) + ", column " + $column + ": Expected " + $joinWithOr($failMatchs) + " but " + (JSON.stringify($input[$failPos]) || "end of input") + " found.";\n\
	throw new Error($errorMessage);\n\
}\n', 1));
	states.push(indentStr + "return $parse;\n");
	states.push("})()");

	if (options.exportVariable) {
		states.unshift(options.exportVariable + " = ");
		states.push(";\n");
	}

	return states.join("");
};

function $joinWithOr(strs) {
	if (strs.length === 0) {
		return "";
	}
	if (strs.length === 1) {
		return strs[0];
	}
	return strs.slice(0, strs.length - 1).join(", ") + " or " + strs[strs.length - 1];
}

var version = require("./version");
var sign = "/*\n * Generated by snake parser " + version + "\n */";

module.exports = genjs;
