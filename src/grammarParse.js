var expressions = require("./expressions");
expressions = expressions.expressions;

var snakeModifiers = {
	arrayToObject: function($) {
		var res = {};
		for (var i = 0, il = $.length; i < il; ++i)
			res[$[i].symbol] = $[i].body;
		return res;
	},
	eval: function($) {
		return eval($);
	},
  ensureMin: function($) {
    return $ === undefined ? 0 : $;
  },
  ensureMax: function($) {
    return $ === undefined ? Infinity : $;
  },
	characterClassChar: function($) {
		var str = $,
		len = str.length;
		if (len === 1) {
			return str.charCodeAt();
		} else if (len === 6) {
			return parseInt(str.substring(2), 16);
		} else if (str === "\\n") {
			return 10;
		} else if (str === "\\t") {
			return 9;
		} else if (str === "\\r") {
			return 13;
		}
		return str.charCodeAt(1);	// \0 とかの場合 0 を返すんだけど、これいらないかも。
	},
	nuturalNumber: function($) {
		return parseInt($);
	},
  expr: function($) {
    return new (expressions[$.op])($.a, $.b, $.c);
  }
};


var str = function(a) {
	return new expressions.str(a);
};
var cc = function(a, b) {
	return new expressions.cc(a, b);
};
var ac = function() {
	return new expressions.ac();
};
var oc = function(a) {
	return new expressions.oc(a);
};
var seq = function(a) {
	return new expressions.seq(a);
};
var rep = function(a, b, c) {
	return new expressions.rep(a, b, c);
};
var obj = function(a) {
	return new expressions.obj(a);
};
var arr = function(a) {
	return new expressions.arr(a);
};
var itm = function(a, b) {
	return new expressions.itm(a, b);
};
var ci = function(a, b) {
	return new expressions.ci(a, b);
};
var tkn = function(a) {
	return new expressions.tkn(a);
};
var ltr = function(a) {
	return new expressions.ltr(a);
};
var pla = function(a) {
	return new expressions.pla(a);
};
var nla = function(a) {
	return new expressions.nla(a);
};
var mod = function(a, b) {
	return new expressions.mod(a, b);
};
var rul = function(a) {
	return new expressions.rul(a);
};

var snakeGrammarRules = {
	"start": obj(seq([rul("__"),rep(0,1,seq([itm("initializer",rul("CodeBlock")),rul("__")])),itm("rules",mod("arrayToObject",arr(rep(0,Infinity,rul("Rule")))))])),
  "Rule": seq([obj(seq([itm("symbol",rul("Identifier")),rul("__"),str("="),rul("__"),itm("body",rul("ChoiceExpression"))])),rul("__")]),
  "ChoiceExpression": seq([mod("expr",obj(seq([itm("op",ltr("oc")),itm("a",arr(seq([rul("SequenceExpression"),rul("__"),rep(0,Infinity,seq([str("|"),rul("__"),rul("SequenceExpression")]))])))]))),rul("__")]),
  "SequenceExpression": seq([mod("expr",obj(seq([itm("op",ltr("seq")),itm("a",arr(seq([rul("LabelExpression"),rep(0,Infinity,seq([rul("__"),rul("LabelExpression")]))])))]))),rul("__")]),
  "LabelExpression": oc([mod("expr",obj(seq([itm("op",ltr("ci")),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":="),rul("__"),itm("b",rul("IdentifierOrStringLiteral"))]))),mod("expr",obj(seq([itm("op",ltr("itm")),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":"),rul("__"),itm("b",rul("ModifyExpression"))]))),rul("ModifyExpression")]),
  "ModifyExpression": oc([mod("expr",obj(seq([itm("op",ltr("mod")),itm("b",rul("ModifyExpression")),rul("__"),str(">"),rul("__"),itm("a",oc([rul("Identifier"),mod(function($) {return new Function("$", $); },rul("CodeBlock"))]))]))),rul("OtherExpression")]),
  "OtherExpression": oc([seq([str("("),rul("__"),rul("ChoiceExpression"),rul("__"),str(")")]),mod("expr",obj(oc([seq([ci("op","str"),itm("a",rul("StringLiteral"))]),seq(ci("op","cc"),str("["),itm("b",oc(seq(str("^"),ltr(true)),seq(ltr(false)))),itm("a",rul("CharacterClass")),str("]")),seq(ci("op","ltr"),str("\\"),rul("__"),itm("a",oc(seq(rul("StringLiteral")),seq(rul("NumericLiteral")),seq(rul("BooleanLiteral")),seq(rul("NullLiteral"))))),seq(ci("op","arr"),str("@"),rul("__"),itm("a",rul("OtherExpression"))),seq(ci("op","obj"),str("{"),rul("__"),itm("a",rul("ChoiceExpression")),rul("__"),str("}")),seq(ci("op","tkn"),str("`"),rul("__"),itm("a",rul("OtherExpression"))),seq(ci("op","pla"),str("&"),rul("__"),itm("a",rul("OtherExpression"))),seq(ci("op","nla"),str("!"),rul("__"),itm("a",rul("OtherExpression"))),seq(ci("op","rep"),str("?"),rul("__"),itm("c",rul("OtherExpression")),itm("b",ltr(1))),seq(ci("op","rep"),str("*"),rul("__"),itm("c",rul("OtherExpression"))),seq(ci("op","rep"),itm("a",rul("NaturalNumber")),itm("b",ltr("min")),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression"))),seq(ci("op","rep"),itm("a",rep(0,1,rul("NaturalNumber"))),str(","),itm("b",rep(0,1,rul("NaturalNumber"))),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression"))),seq(ci("op","rep"),str("+"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(1))),seq(ci("op","ac"),str(".")),seq(ci("op","rul"),itm("a",rul("Identifier")),nla(oc(seq(rul("__"),str("=")))))])))]),
  "__": oc(seq(rep(0,1,rep(1,Infinity,oc(seq(cc([{"type":"single","char":32},{"type":"single","char":9},{"type":"single","char":13},{"type":"single","char":10}],false)),seq(rul("Comment"))))))),
  "Comment": oc(seq(str("//"),rep(0,Infinity,cc([{"type":"single","char":10}],true)),oc(seq(str("\n")),seq(nla(ac())))),seq(str("/*"),rep(0,Infinity,oc(seq(cc([{"type":"single","char":42}],true)),seq(str("*"),cc([{"type":"single","char":47}],true)))),str("*/"))),
  "Identifier": oc(seq(tkn(oc(seq(cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"single","char":95}],false),rep(0,Infinity,cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"range","start":48,"end":57},{"type":"single","char":95}],false))))))),
	"IdentifierOrStringLiteral": oc(seq(rul("StringLiteral")),seq(rul("Identifier"))),
  "StringLiteral": oc(seq(mod("eval",tkn(oc(seq(oc(seq(str("'"),rep(0,Infinity,oc(seq(rep(1,Infinity,cc([{"type":"single","char":39},{"type":"single","char":92}],true))),seq(str("\\u"),rep(4,4,cc([{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}],false))),seq(str("\\"),cc([{"type":"single","char":117}],true)))),str("'")))),seq(oc(seq(str("\""),rep(0,Infinity,oc(seq(rep(1,Infinity,cc([{"type":"single","char":34},{"type":"single","char":92}],true))),seq(str("\\u"),rep(4,4,cc([{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}],false))),seq(str("\\"),cc([{"type":"single","char":117}],true)))),str("\""))))))))),
  "CharacterClass": oc(seq(arr(rep(0,Infinity,obj(oc(seq(itm("type",ltr("range")),itm("start",rul("CharacterClassChar")),str("-"),itm("end",rul("CharacterClassChar"))),seq(itm("type",ltr("single")),itm("char",rul("CharacterClassChar"))))))))),
  "CharacterClassChar": oc(seq(mod("characterClassChar",tkn(oc(seq(cc([{"type":"single","char":93},{"type":"single","char":92}],true)),seq(str("\\u"),rep(4,4,cc([{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}],false))),seq(str("\\"),cc([{"type":"single","char":117}],true))))))),
  "CodeBlock": seq(str("{"),rul("Code"),str("}")),
  "Code": oc(seq(tkn(rep(0,Infinity,oc(seq(rep(1,Infinity,oc(seq(nla(cc([{"type":"single","char":123},{"type":"single","char":125}],false)),ac())))),seq(str("{"),rul("Code"),str("}"))))))),
  "NaturalNumber": oc(seq(mod("nuturalNumber",tkn(oc(seq(cc([{"type":"range","start":49,"end":57}],false),rep(0,Infinity,cc([{"type":"range","start":48,"end":57}],false))),seq(str("0"))))))),
  "NullLiteral": oc(seq(mod("eval",tkn(str("null"))))),
  "BooleanLiteral": oc(seq(mod("eval",tkn(oc(seq(str("true")),seq(str("false"))))))),
  "NumericLiteral": oc(seq(mod("eval",tkn(oc(seq(rep(0,1,str("-")),oc(seq(rul("HexIntegerLiteral")),seq(rul("DecimalLiteral"))))))))),
  "DecimalLiteral": oc(seq(rul("DecimalIntegerLiteral"),str("."),rep(0,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))),seq(str("."),rep(1,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))),seq(rul("DecimalIntegerLiteral"),rep(0,1,rul("ExponentPart")))),
  "DecimalIntegerLiteral": oc(seq(str("0")),seq(rul("NonZeroDigit"),rep(0,Infinity,rul("DecimalDigit")))),
  "DecimalDigit": oc(seq(cc([{"type":"range","start":48,"end":57}],false))),
  "NonZeroDigit": oc(seq(cc([{"type":"range","start":49,"end":57}],false))),
  "ExponentPart": oc(seq(rul("ExponentIndicator"),rul("SignedInteger"))),
  "ExponentIndicator": oc(seq(str("e")),seq(str("E"))),
  "SignedInteger": oc(seq(rep(0,1,cc([{"type":"single","char":43},{"type":"single","char":45}],false)),rep(1,Infinity,rul("DecimalDigit")))),
  "HexIntegerLiteral": oc(seq(oc(seq(str("0x")),seq(str("0X"))),rep(1,Infinity,rul("HexDigit")))),
  "HexDigit": oc(seq(cc([{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}],false))),
};


var snakeGrammarRules = {
	BooleanLiteral: oc([seq([str("true"),ltr(true)]),seq([str("false"),ltr(false)])]),
	CharacterClass: arr(rep(0,Infinity,obj(oc([seq([itm("type",ltr("range")),itm("start",rul("CharacterClassChar")),str("-"),itm("end",rul("CharacterClassChar"))]),seq([itm("type",ltr("single")),itm("char",rul("CharacterClassChar"))])])))),
	CharacterClassChar: mod("characterClassChar",tkn(oc([cc([{"type":"single","char":93},{"type":"single","char":92}],true),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])]))),
	ChoiceExpression: oc([seq([mod("expr",obj(seq([itm("op",ltr("oc")),itm("a",arr(seq([rul("SequenceExpression"),rul("__"),rep(1,Infinity,seq([str("|"),rul("__"),rul("SequenceExpression")]))])))]))),rul("__")]),seq([rul("SequenceExpression"),rul("__")])]),
	Code: tkn(rep(0,Infinity,oc([rep(1,Infinity,cc([{"type":"single","char":123},{"type":"single","char":125}],true)),seq([str("{"),rul("Code"),str("}")])]))),
	CodeBlock: seq([str("{"),rul("Code"),str("}")]),
	Comment: oc([seq([str("//"),rep(0,Infinity,cc([{"type":"single","char":10}],true)),oc([str("\n"),nla(ac())])]),seq([str("/*"),rep(0,Infinity,oc([cc([{"type":"single","char":42}],true),seq([str("*"),cc([{"type":"single","char":47}],true)])])),str("*/")])]),
	DecimalDigit: cc([{"type":"range","start":48,"end":57}],false),
	DecimalIntegerLiteral: oc([str("0"),seq([rul("NonZeroDigit"),rep(0,Infinity,rul("DecimalDigit"))])]),
	DecimalLiteral: oc([seq([rul("DecimalIntegerLiteral"),str("."),rep(0,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))]),seq([str("."),rep(1,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))]),seq([rul("DecimalIntegerLiteral"),rep(0,1,rul("ExponentPart"))])]),
	ExponentIndicator: oc([str("e"),str("E")]),
	ExponentPart: seq([rul("ExponentIndicator"),rul("SignedInteger")]),
	HexDigit: cc([{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}],false),
	HexIntegerLiteral: seq([oc([str("0x"),str("0X")]),rep(1,Infinity,rul("HexDigit"))]),
	Identifier: tkn(seq([cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"single","char":95}],false),rep(0,Infinity,cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"range","start":48,"end":57},{"type":"single","char":95}],false))])),
	IdentifierOrStringLiteral: oc([rul("StringLiteral"),rul("Identifier")]),
	LabelExpression: oc([mod("expr",obj(seq([itm("op",ltr("ci")),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":="),rul("__"),itm("b",rul("IdentifierOrStringLiteral"))]))),mod("expr",obj(seq([itm("op",ltr("itm")),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":"),rul("__"),itm("b",rul("ModifyExpression"))]))),rul("ModifyExpression")]),
	ModifyExpression: oc([mod("expr",obj(seq([itm("op",ltr("mod")),itm("b",rul("ModifyExpression")),rul("__"),str(">"),rul("__"),itm("a",oc([rul("Identifier"),mod(function($) { return new Function("$", $); },rul("CodeBlock"))]))]))),rul("OtherExpression")]),
	NaturalNumber: mod("nuturalNumber",tkn(oc([seq([cc([{"type":"range","start":49,"end":57}],false),rep(0,Infinity,cc([{"type":"range","start":48,"end":57}],false))]),str("0")]))),
	NonZeroDigit: cc([{"type":"range","start":49,"end":57}],false),
	NullLiteral: seq([str("null"),ltr(null)]),
	NumericLiteral: mod("eval",tkn(seq([rep(0,1,str("-")),oc([rul("HexIntegerLiteral"),rul("DecimalLiteral")])]))),
	OtherExpression: oc([seq([str("("),rul("__"),rul("ChoiceExpression"),rul("__"),str(")")]),mod("expr",obj(oc([seq([ci("op","str"),itm("a",rul("StringLiteral"))]),seq([ci("op","cc"),str("["),itm("b",oc([seq([str("^"),ltr(true)]),ltr(false)])),itm("a",rul("CharacterClass")),str("]")]),seq([ci("op","ltr"),str("\\"),rul("__"),itm("a",oc([rul("StringLiteral"),rul("NumericLiteral"),rul("BooleanLiteral"),rul("NullLiteral")]))]),seq([ci("op","arr"),str("@"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","obj"),str("{"),rul("__"),itm("a",rul("ChoiceExpression")),rul("__"),str("}")]),seq([ci("op","tkn"),str("`"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","pla"),str("&"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","nla"),str("!"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","rep"),str("?"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(0)),itm("b",ltr(1))]),seq([ci("op","rep"),str("*"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(0)),itm("b",mod(function($) {return Infinity},ltr(0)))]),seq([ci("op","rep"),itm("a",rul("NaturalNumber")),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression")),itm("b",ltr("min"))]),seq([ci("op","rep"),itm("a",mod("ensureMin",rep(0,1,rul("NaturalNumber")))),str(","),itm("b",mod("ensureMax",rep(0,1,rul("NaturalNumber")))),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression"))]),seq([ci("op","rep"),str("+"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(1)),itm("b",mod(function($) {return Infinity},ltr(0)))]),seq([ci("op","ac"),str(".")]),seq([ci("op","pi"),str("$"),itm("a",rul("Identifier"))]),seq([ci("op","rul"),itm("a",rul("Identifier")),nla(seq([rul("__"),str("=")]))])])))]),
	Rule: seq([obj(seq([itm("symbol",rul("Identifier")),rul("__"),str("="),rul("__"),itm("body",rul("ChoiceExpression"))])),rul("__")]),
	SequenceExpression: oc([seq([mod("expr",obj(seq([itm("op",ltr("seq")),itm("a",arr(seq([rul("LabelExpression"),rep(1,Infinity,seq([rul("__"),rul("LabelExpression")]))])))]))),rul("__")]),seq([rul("LabelExpression"),rul("__")])]),
	SignedInteger: seq([rep(0,1,cc([{"type":"single","char":43},{"type":"single","char":45}],false)),rep(1,Infinity,rul("DecimalDigit"))]),
	StringLiteral: mod("eval",tkn(oc([seq([str("'"),rep(0,Infinity,oc([cc([{"type":"single","char":39},{"type":"single","char":92},{"type":"range","start":0,"end":31}],true),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("'")]),seq([str("\""),rep(0,Infinity,oc([cc([{"type":"single","char":34},{"type":"single","char":92},{"type":"range","start":0,"end":31}],true),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("\"")])]))),
	__: rep(0,1,rep(1,Infinity,oc([cc([{"type":"single","char":32},{"type":"single","char":9},{"type":"single","char":13},{"type":"single","char":10}],false),rul("Comment")]))),
	start: seq([rul("__"),obj(seq([rep(0,1,seq([itm("initializer",rul("CodeBlock")),rul("__")])),itm("rules",mod("arrayToObject",arr(rep(0,Infinity,rul("Rule")))))]))]),
};

var Parser = require("./parserObject");

module.exports = new Parser(snakeGrammarRules, snakeModifiers);
