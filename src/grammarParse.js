var expressions = require("./expressions");
var genjs = require("./genjs");

var initializer = '\
	function arrayToObject($) {\n\
		var res = {};\n\
		for (var i = 0, il = $.length; i < il; ++i)\n\
			res[$[i].symbol] = $[i];\n\
		return res;\n\
	};\n\
	function ensureMin($) {\n\
		return $ === undefined ? 0 : $;\n\
	};\n\
	function ensureMax($) {\n\
		return $ === undefined ? Infinity : $;\n\
	};\n\
	function characterClassChar($) {\n\
		var str = $,\n\
		len = str.length;\n\
		if (len === 1)\n\
			return str.charCodeAt();\n\
		if (len === 4 || len === 6)\n\
			return parseInt(str.substring(2), 16);\n\
		if (str === "\\\\b")\n\
			return "\\b".charCodeAt();\n\
		if (str === "\\\\t")\n\
			return "\\t".charCodeAt();\n\
		if (str === "\\\\v")\n\
			return "\\v".charCodeAt();\n\
		if (str === "\\\\n")\n\
			return "\\n".charCodeAt();\n\
		if (str === "\\\\r")\n\
			return "\\r".charCodeAt();\n\
		if (str === "\\\\f")\n\
			return "\\f".charCodeAt();\n\
		return str.charCodeAt(1);\n\
	};\n\
	function nuturalNumber($) {\n\
		return +$;\n\
	};\n\
	function expr($) {\n\
		return new (options.expressions[$.op])($.a, $.b, $.c);\n\
	};';


var nop = function() {
	return new expressions.nop();
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
var mod = function(a, b, c) {
	return new expressions.mod(a, b, c);
};
var grd = function(a, b, c) {
	return new expressions.grd(a, b, c);
};
var wst = function(a) {
	return new expressions.wst(a);
};
var rul = function(a, b) {
	return new expressions.rul(a, b);
};

var rules = {
	BooleanLiteral: oc([seq([str("true"),ltr(true)]),seq([str("false"),ltr(false)])]),
	CharacterClass: arr(rep(0,Infinity,obj(oc([seq([itm("type",ltr("range")),itm("start",rul("CharacterClassChar")),str("-"),itm("end",rul("CharacterClassChar"))]),seq([itm("type",ltr("single")),itm("char",rul("CharacterClassChar"))])])))),
	CharacterClassChar: mod(tkn(oc([cc([{"type":"single","char":93},{"type":"single","char":92}],true),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),"characterClassChar",null),
	ChoiceExpression: oc([seq([mod(obj(seq([ci("op","oc"),itm("a",arr(seq([rul("SequenceExpression"),rul("__"),rep(1,Infinity,seq([str("|"),rul("__"),rul("SequenceExpression")]))])))])),"expr",null),rul("__")]),seq([rul("SequenceExpression"),rul("__")]),mod(obj(ci("op","nop")),"expr",null)]),
	Code: rep(0,Infinity,oc([cc([{"type":"single","char":123},{"type":"single","char":125}],true),seq([str("{"),rul("Code"),str("}")])])),
	CodeBlock: seq([str("{"),tkn(rul("Code")),str("}")]),
	Comment: oc([seq([str("//"),rep(0,Infinity,cc([{"type":"single","char":10}],true)),oc([str("\n"),nla(ac())])]),seq([str("/*"),rep(0,Infinity,oc([cc([{"type":"single","char":42}],true),seq([str("*"),cc([{"type":"single","char":47}],true)])])),str("*/")])]),
	DecimalDigit: cc([{"type":"range","start":48,"end":57}],false),
DecimalIntegerLiteral: oc([str("0"),seq([rul("NonZeroDigit"),rep(0,Infinity,rul("DecimalDigit"))])]),
	DecimalLiteral: oc([seq([rul("DecimalIntegerLiteral"),str("."),rep(0,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))]),seq([str("."),rep(1,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))]),seq([rul("DecimalIntegerLiteral"),rep(0,1,rul("ExponentPart"))])]),
	ExponentIndicator: cc([{"type":"single","char":101},{"type":"single","char":69}],false),
	ExponentPart: seq([rul("ExponentIndicator"),rul("SignedInteger")]),
	HexDigit: cc([{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}],false),
	HexIntegerLiteral: seq([oc([str("0x"),str("0X")]),rep(1,Infinity,rul("HexDigit"))]),
	Identifier: tkn(seq([cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"single","char":95}],false),rep(0,Infinity,cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"range","start":48,"end":57},{"type":"single","char":95}],false))])),
	IdentifierOrStringLiteral: oc([rul("StringLiteral"),rul("Identifier")]),
	LabelExpression: oc([mod(obj(seq([ci("op","ci"),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":="),rul("__"),itm("b",rul("IdentifierOrStringLiteral"))])),"expr",null),mod(obj(seq([ci("op","itm"),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":"),rul("__"),itm("b",rul("ModifyExpression"))])),"expr",null),rul("ModifyExpression")]),
	LineTerminator: cc([{"type":"single","char":10},{"type":"single","char":13},{"type":"single","char":8232},{"type":"single","char":8233}],false),
	ModifyExpression: oc([mod(obj(seq([itm("a",rul("ModifyExpression")),rul("__"),oc([seq([str("->"),rul("__"),ci("op","mod"),oc([seq([itm("b",rul("Identifier")),itm("c",ltr(null))]),seq([itm("b",ltr(null)),itm("c",rul("CodeBlock"))])])]),seq([str("-?"),rul("__"),ci("op","grd"),oc([seq([itm("b",rul("Identifier")),itm("c",ltr(null))]),seq([itm("b",ltr(null)),itm("c",rul("CodeBlock"))])])]),seq([str("-|"),ci("op","wst")])])])),"expr",null),rul("OtherExpression")]),
	NaturalNumber: mod(tkn(oc([seq([cc([{"type":"range","start":49,"end":57}],false),rep(0,Infinity,cc([{"type":"range","start":48,"end":57}],false))]),str("0")])),"nuturalNumber",null),
	NonZeroDigit: cc([{"type":"range","start":49,"end":57}],false),
	NullLiteral: seq([str("null"),ltr(null)]),
	NumericLiteral: mod(tkn(seq([rep(0,1,str("-")),oc([rul("HexIntegerLiteral"),rul("DecimalLiteral")])])),"eval",null),
	OtherExpression: oc([seq([str("("),rul("__"),rul("ChoiceExpression"),rul("__"),str(")")]),mod(obj(oc([seq([ci("op","str"),itm("a",rul("StringLiteral"))]),seq([ci("op","cc"),str("["),itm("b",oc([seq([str("^"),ltr(true)]),ltr(false)])),itm("a",rul("CharacterClass")),str("]")]),seq([ci("op","ltr"),str("\\"),rul("__"),itm("a",oc([rul("StringLiteral"),rul("NumericLiteral"),rul("BooleanLiteral"),rul("NullLiteral")]))]),seq([ci("op","arr"),str("@"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","obj"),str("{"),rul("__"),itm("a",rul("ChoiceExpression")),rul("__"),str("}")]),seq([ci("op","tkn"),str("`"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","pla"),str("&"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","nla"),str("!"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","rep"),str("?"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(0)),itm("b",ltr(1))]),seq([ci("op","rep"),str("*"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(0)),itm("b",mod(ltr(0),null,"return Infinity"))]),seq([ci("op","rep"),itm("a",rul("NaturalNumber")),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression")),itm("b",ltr("min"))]),seq([ci("op","rep"),itm("a",mod(rep(0,1,rul("NaturalNumber")),"ensureMin",null)),str(","),itm("b",mod(rep(0,1,rul("NaturalNumber")),"ensureMax",null)),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression"))]),seq([ci("op","rep"),str("+"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(1)),itm("b",mod(ltr(0),null,"return Infinity"))]),seq([ci("op","ac"),str(".")]),seq([ci("op","pi"),str("$"),itm("a",rul("Identifier"))]),seq([ci("op","rul"),nla(rul("Rule")),itm("a",rul("Identifier")),rep(0,1,seq([rul("__"),itm("b",rul("RuleArguments"))]))])])),"expr",null)]),
	RegexpLiteralRaw: seq([str("/"),rep(0,Infinity,oc([cc([{"type":"single","char":47},{"type":"single","char":92}],true),seq([str("\\"),ac()])])),str("/")]),
	Rule: obj(seq([itm("symbol",rul("Identifier")),rul("__"),rep(0,1,seq([itm("parameters",rul("RuleParameters")),rul("__")])),rep(0,1,seq([itm("name",rul("StringLiteral")),rul("__")])),str("="),rul("__"),itm("body",rul("ChoiceExpression")),rul("__")])),
	RuleArguments: arr(seq([str("<"),rul("__"),rep(0,1,seq([rul("ChoiceExpression"),rul("__"),rep(0,Infinity,seq([str(","),rul("__"),rul("ChoiceExpression"),rul("__")]))])),str(">")])),
	RuleParameters: arr(seq([str("<"),rul("__"),rep(0,1,seq([rul("Identifier"),rul("__"),rep(0,Infinity,seq([str(","),rul("__"),rul("Identifier"),rul("__")]))])),str(">")])),
	SequenceExpression: oc([seq([mod(obj(seq([ci("op","seq"),itm("a",arr(seq([rul("LabelExpression"),rep(1,Infinity,seq([rul("__"),rul("LabelExpression")]))])))])),"expr",null),rul("__")]),seq([rul("LabelExpression"),rul("__")])]),
	SignedInteger: seq([rep(0,1,cc([{"type":"single","char":43},{"type":"single","char":45}],false)),rep(1,Infinity,rul("DecimalDigit"))]),
	StringLiteral: mod(tkn(rul("StringLiteralRaw")),"eval",null),
	StringLiteralRaw: oc([seq([str("'"),rep(0,Infinity,oc([seq([nla(rul("LineTerminator")),cc([{"type":"single","char":39},{"type":"single","char":92}],true)]),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("'")]),seq([str("\""),rep(0,Infinity,oc([seq([nla(rul("LineTerminator")),cc([{"type":"single","char":34},{"type":"single","char":92}],true)]),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("\"")])]),
	__: rep(0,Infinity,oc([cc([{"type":"single","char":32},{"type":"single","char":9},{"type":"single","char":13},{"type":"single","char":10}],false),rul("Comment")])),
	start: obj(seq([rul("__"),rep(0,1,seq([itm("initializer",rul("CodeBlock")),rul("__")])),itm("rules",mod(arr(rep(0,Infinity,rul("Rule"))),"arrayToObject",null))])),
};

for (var s in rules) {
	rules[s] = {
		symbol: s, // TODO identifier
		body: rules[s],
		name: null,
		parameters: null,
	};
}

var rules = {
	"start": {
		symbol: "start",
		body: obj(seq([rul("__"),itm("initializer",oc([seq([rul("CodeBlock"),rul("__")]),ltr("")])),itm("rules",mod(arr(rep(0,Infinity,rul("Rule"))),"arrayToObject",null))])),
	},
	"Rule": {
		symbol: "Rule",
		body: obj(seq([itm("symbol",rul("Identifier")),rul("__"),rep(0,1,seq([itm("parameters",rul("RuleParameters")),rul("__")])),rep(0,1,seq([itm("name",rul("StringLiteral")),rul("__")])),str("="),rul("__"),itm("body",rul("ChoiceExpression")),rul("__")])),
	},
	"RuleParameters": {
		symbol: "RuleParameters",
		body: arr(seq([str("<"),rul("__"),rep(0,1,seq([rul("Identifier"),rul("__"),rep(0,Infinity,seq([str(","),rul("__"),rul("Identifier"),rul("__")]))])),str(">")])),
	},
	"ChoiceExpression": {
		symbol: "ChoiceExpression",
		body: oc([seq([mod(obj(seq([ci("op","oc"),itm("a",arr(seq([rul("SequenceExpression"),rul("__"),rep(1,Infinity,seq([str("|"),rul("__"),rul("SequenceExpression")]))])))])),"expr",null),rul("__")]),seq([rul("SequenceExpression"),rul("__")]),mod(obj(ci("op","nop")),"expr",null)]),
	},
	"SequenceExpression": {
		symbol: "SequenceExpression",
		body: oc([seq([mod(obj(seq([ci("op","seq"),itm("a",arr(seq([rul("LabelExpression"),rep(1,Infinity,seq([rul("__"),rul("LabelExpression")]))])))])),"expr",null),rul("__")]),seq([rul("LabelExpression"),rul("__")])]),
	},
	"LabelExpression": {
		symbol: "LabelExpression",
		body: oc([mod(obj(seq([ci("op","ci"),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":="),rul("__"),itm("b",rul("IdentifierOrStringLiteral"))])),"expr",null),mod(obj(seq([ci("op","itm"),itm("a",rul("IdentifierOrStringLiteral")),rul("__"),str(":"),rul("__"),itm("b",rul("ModifyExpression"))])),"expr",null),rul("ModifyExpression")]),
	},
	"ModifyExpression": {
		symbol: "ModifyExpression",
		body: oc([mod(obj(seq([itm("a",rul("ModifyExpression")),rul("__"),oc([seq([str("->"),rul("__"),ci("op","mod"),oc([seq([itm("b",rul("Identifier")),itm("c",ltr(null))]),seq([itm("b",ltr(null)),itm("c",rul("CodeBlock"))])])]),seq([str("-?"),rul("__"),ci("op","grd"),oc([seq([itm("b",rul("Identifier")),itm("c",ltr(null))]),seq([itm("b",ltr(null)),itm("c",rul("CodeBlock"))])])]),seq([str("-|"),ci("op","wst")])])])),"expr",null),rul("OtherExpression")]),
	},
	"OtherExpression": {
		symbol: "OtherExpression",
		body: oc([seq([str("("),rul("__"),rul("ChoiceExpression"),rul("__"),str(")")]),mod(obj(oc([seq([ci("op","str"),itm("a",rul("StringLiteral"))]),seq([ci("op","cc"),str("["),itm("b",oc([seq([str("^"),ltr(true)]),ltr(false)])),itm("a",rul("CharacterClass")),str("]")]),seq([ci("op","ltr"),str("\\"),rul("__"),itm("a",oc([rul("StringLiteral"),rul("NumericLiteral"),rul("BooleanLiteral"),rul("NullLiteral")]))]),seq([ci("op","arr"),str("@"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","obj"),str("{"),rul("__"),itm("a",rul("ChoiceExpression")),rul("__"),str("}")]),seq([ci("op","tkn"),str("`"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","pla"),str("&"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","nla"),str("!"),rul("__"),itm("a",rul("OtherExpression"))]),seq([ci("op","rep"),str("?"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(0)),itm("b",ltr(1))]),seq([ci("op","rep"),str("*"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(0)),itm("b",mod(ltr(0),null,"return Infinity"))]),seq([ci("op","rep"),itm("a",rul("NaturalNumber")),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression")),itm("b",ltr("min"))]),seq([ci("op","rep"),itm("a",mod(rep(0,1,rul("NaturalNumber")),"ensureMin",null)),str(","),itm("b",mod(rep(0,1,rul("NaturalNumber")),"ensureMax",null)),rul("__"),str("*"),rul("__"),itm("c",rul("OtherExpression"))]),seq([ci("op","rep"),str("+"),rul("__"),itm("c",rul("OtherExpression")),itm("a",ltr(1)),itm("b",mod(ltr(0),null,"return Infinity"))]),seq([ci("op","ac"),str(".")]),seq([ci("op","pi"),str("$"),itm("a",rul("Identifier"))]),seq([ci("op","rul"),nla(rul("Rule")),itm("a",rul("Identifier")),rep(0,1,seq([rul("__"),itm("b",rul("RuleArguments"))]))])])),"expr",null)]),
	},
	"RuleArguments": {
		symbol: "RuleArguments",
		body: arr(seq([str("<"),rul("__"),rep(0,1,seq([rul("ChoiceExpression"),rul("__"),rep(0,Infinity,seq([str(","),rul("__"),rul("ChoiceExpression"),rul("__")]))])),str(">")])),
	},
	"__": {
		symbol: "__",
		name: "white space",
		body: rep(0,Infinity,oc([cc([{"type":"single","char":32},{"type":"single","char":9},{"type":"single","char":13},{"type":"single","char":10}],false),rul("Comment")])),
	},
	"Comment": {
		symbol: "Comment",
		body: oc([seq([str("//"),rep(0,Infinity,cc([{"type":"single","char":10}],true)),oc([str("\n"),nla(ac())])]),seq([str("/*"),rep(0,Infinity,oc([cc([{"type":"single","char":42}],true),seq([str("*"),cc([{"type":"single","char":47}],true)])])),str("*/")])]),
	},
	"LineTerminator": {
		symbol: "LineTerminator",
		body: cc([{"type":"single","char":10},{"type":"single","char":13},{"type":"single","char":8232},{"type":"single","char":8233}],false),
	},
	"Identifier": {
		symbol: "Identifier",
		name: "identifier",
		body: tkn(seq([cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"single","char":95}],false),rep(0,Infinity,cc([{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"range","start":48,"end":57},{"type":"single","char":95}],false))])),
	},
	"IdentifierOrStringLiteral": {
		symbol: "IdentifierOrStringLiteral",
		body: oc([rul("StringLiteral"),rul("Identifier")]),
	},
	"StringLiteral": {
		symbol: "StringLiteral",
		name: "string literal",
		body: mod(tkn(rul("StringLiteralRaw")),"eval",null),
	},
	"StringLiteralRaw": {
		symbol: "StringLiteralRaw",
		body: oc([seq([str("'"),rep(0,Infinity,oc([seq([nla(rul("LineTerminator")),cc([{"type":"single","char":39},{"type":"single","char":92}],true)]),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("'")]),seq([str("\""),rep(0,Infinity,oc([seq([nla(rul("LineTerminator")),cc([{"type":"single","char":34},{"type":"single","char":92}],true)]),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),str("\"")])]),
	},
	"CharacterClass": {
		symbol: "CharacterClass",
		body: arr(rep(0,Infinity,obj(oc([seq([itm("type",ltr("range")),itm("start",rul("CharacterClassChar")),str("-"),itm("end",rul("CharacterClassChar"))]),seq([itm("type",ltr("single")),itm("char",rul("CharacterClassChar"))])])))),
	},
	"CharacterClassChar": {
		symbol: "CharacterClassChar",
		body: mod(tkn(oc([cc([{"type":"single","char":93},{"type":"single","char":92}],true),seq([str("\\x"),rep(2,2,rul("HexDigit"))]),seq([str("\\u"),rep(4,4,rul("HexDigit"))]),seq([str("\\"),cc([{"type":"single","char":117},{"type":"single","char":120}],true)])])),"characterClassChar",null),
	},
	"CodeBlock": {
		symbol: "CodeBlock",
		name: "code block",
		body: seq([str("{"),tkn(rul("Code")),str("}")]),
	},
	"Code": {
		symbol: "Code",
		body: rep(0,Infinity,oc([cc([{"type":"single","char":123},{"type":"single","char":125}],true),seq([str("{"),rul("Code"),str("}")])])),
	},
	"NaturalNumber": {
		symbol: "NaturalNumber",
		name: "natural number",
		body: mod(tkn(oc([seq([cc([{"type":"range","start":49,"end":57}],false),rep(0,Infinity,cc([{"type":"range","start":48,"end":57}],false))]),str("0")])),"nuturalNumber",null),
	},
	"NullLiteral": {
		symbol: "NullLiteral",
		body: seq([str("null"),ltr(null)]),
	},
	"BooleanLiteral": {
		symbol: "BooleanLiteral",
		body: oc([seq([str("true"),ltr(true)]),seq([str("false"),ltr(false)])]),
	},
	"NumericLiteral": {
		symbol: "NumericLiteral",
		name: "numeric literal",
		body: mod(tkn(seq([rep(0,1,str("-")),oc([rul("HexIntegerLiteral"),rul("DecimalLiteral")])])),"eval",null),
	},
	"DecimalLiteral": {
		symbol: "DecimalLiteral",
		body: oc([seq([rul("DecimalIntegerLiteral"),str("."),rep(0,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))]),seq([str("."),rep(1,Infinity,rul("DecimalDigit")),rep(0,1,rul("ExponentPart"))]),seq([rul("DecimalIntegerLiteral"),rep(0,1,rul("ExponentPart"))])]),
	},
	"DecimalIntegerLiteral": {
		symbol: "DecimalIntegerLiteral",
		body: oc([str("0"),seq([rul("NonZeroDigit"),rep(0,Infinity,rul("DecimalDigit"))])]),
	},
	"DecimalDigit": {
		symbol: "DecimalDigit",
		body: cc([{"type":"range","start":48,"end":57}],false),
	},
	"NonZeroDigit": {
		symbol: "NonZeroDigit",
		body: cc([{"type":"range","start":49,"end":57}],false),
	},
	"ExponentPart": {
		symbol: "ExponentPart",
		body: seq([rul("ExponentIndicator"),rul("SignedInteger")]),
	},
	"ExponentIndicator": {
		symbol: "ExponentIndicator",
		body: cc([{"type":"single","char":101},{"type":"single","char":69}],false),
	},
	"SignedInteger": {
		symbol: "SignedInteger",
		body: seq([rep(0,1,cc([{"type":"single","char":43},{"type":"single","char":45}],false)),rep(1,Infinity,rul("DecimalDigit"))]),
	},
	"HexIntegerLiteral": {
		symbol: "HexIntegerLiteral",
		body: seq([oc([str("0x"),str("0X")]),rep(1,Infinity,rul("HexDigit"))]),
	},
	"HexDigit": {
		symbol: "HexDigit",
		body: cc([{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}],false),
	},
};

var code = genjs(rules, initializer);

module.exports = eval(code);
