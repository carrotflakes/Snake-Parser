const SnakeParser = require('../../dist/snakeParser.js');

var parser = null, code = null;
var examplesElm = document.getElementById("examples");
var syntaxMessageElm = document.getElementById("syntaxMessage"),
resultMessageElm = document.getElementById("resultMessage");
var updateParserTime = new Date().getTime(),
updateModifierTime = new Date().getTime(),
updateInputTextTime = new Date().getTime();
var grammarEditor = ace.edit("grammar");
var inputTextEditor = ace.edit("input_text");

grammarEditor.$blockScrolling = Infinity;
inputTextEditor.$blockScrolling = Infinity;

grammarEditor.getSession().on('change', function() {
	updateParserTime = new Date().getTime() + 1000;

	if (document.activeElement !== examplesElm)
		examplesElm.value = "";
});
inputTextEditor.getSession().on('change', function() {
	updateInputTextTime = new Date().getTime() + 1000;
});

grammarEditor.setDisplayIndentGuides(false);
inputTextEditor.setDisplayIndentGuides(false);

window.setInterval(function() {
	var now = new Date().getTime();
	if (updateParserTime < now) {
		updateParserTime = Infinity;
		updateInputTextTime = Infinity;

		buildParser();
		parse();
	} else if (updateInputTextTime < now) {
		updateInputTextTime = Infinity;

		parse();
	}
}, 250);


function buildParser() {
	var grammar = grammarEditor.getValue();
	code = null;
	parser = null;

	try {
		var t = new Date().getTime();
    code = SnakeParser.buildParser(grammar);
		parser = eval(code);
		t = new Date().getTime() - t;

		syntaxMessageElm.innerHTML = ("Parser built successfully.\n" + t + "ms").replace(/\n/g, "<br>");
  } catch (e) {
		syntaxMessageElm.innerHTML = e.message.replace(/\n/g, "<br>");
		parser = null;
  }

	resultMessageElm.innerHTML = "";
};


function parse() {
	if (parser === null)
		return;

	var resultElem = document.getElementById("result");

	resultElem.value = "";

	var inputText = inputTextEditor.getValue();

	try {
		var t = new Date().getTime();
		var result = parser(inputText);
		t = new Date().getTime() - t;

		resultMessageElm.innerHTML = ("Input parsed successfully.\n" + t + "ms").replace(/\n/g, "<br>");
		resultElem.value = stringify(result, null, "  ");
	} catch (e) {
		resultMessageElm.innerHTML = e.message.replace(/\n/g, "<br>");
		resultElem.value = "";
	}
};

function toJS() {
	if (code === null)
		return;

	var resultElem = document.getElementById("result");

	resultElem.value = code;
};
document.getElementById("generate").onclick = toJS;


function stringify(object, indent) {
	function stringStringify(string) {
		return JSON.stringify(string)
			.replace(/\u2028/g, "\\u2028")
			.replace(/\u2029/g, "\\u2029");
	}

	indent = (indent || "");
	var indent_ = indent + "  ";

	if (object === null)
		return "null";

	switch (typeof object) {
	case "string":
		return stringStringify(object);
	case "number":
	case "boolean":
		return JSON.stringify(object);
	case "undefined":
		return "undefined";
	case "object":
		if (object instanceof Array) {
			return "[" +
				object.map(function (value) {
					return "\n" + indent_ + stringify(value, indent_);
				}).join(",") +
				"\n" + indent + "]";
		} else {
			var keys = Object.keys(object);
			if (keys.length === 0)
				return "{}";
			var members = keys.map(function (key) {
				return "\n" + indent_ + stringStringify(key) + ": " + stringify(object[key], indent_);
			});
			return "{" +
				members.join(",") +
				"\n" + indent + "}";
		}
	}
}


function example(idx) {
	if (idx === "")
		return;

	grammarEditor.setValue(examples[+idx].grammar);
	inputTextEditor.setValue(examples[+idx].inputText);
	grammarEditor.clearSelection();
	inputTextEditor.clearSelection();

	updateParserTime = new Date().getTime();

	if (examplesElm.value !== idx)
		examplesElm.value = idx;
};

var examples = [
{
	grammar: "{\n  function add(o) {\n    return o.left + o.right;\n  }\n  function subtract(o) {\n    return o.left - o.right;\n  }\n  function multiple(o) {\n    return o.left * o.right;\n  }\n  function divide(o) {\n    return o.left / o.right;\n  }\n  function modulo(o) {\n    return o.left % o.right;\n  }\n  function integer(o) {\n    return +o;\n  }\n}\n\nstart\n  = ws additive ws\n\nadditive\n  = {left:additive ws \"+\" ws right:multiplicative} -> add\n  | {left:additive ws \"-\" ws right:multiplicative} -> subtract\n  | multiplicative\n\nmultiplicative\n  = {left:multiplicative ws \"*\" ws right:primary} -> multiple\n  | {left:multiplicative ws \"/\" ws right:primary} -> divide\n  | {left:multiplicative ws \"%\" ws right:primary} -> modulo\n  | primary\n\nprimary\n  = integer\n  | \"(\" ws additive ws \")\"\n\ninteger \"integer\"\n  = `(?'-' +[0-9]) -> integer\n\nws \"whitespace\"\n  = *[ \\t\\r\\n]",
	inputText: '1+2*(3+4)'
}, {
	grammar: "{\n    function rules(rules) {\n        var lines = [];\n        lines.push(\"{\");\n        for (var i in rules) {\n            lines.push(rule(rules[i]) + \",\");\n        }\n        lines.push(\"}\");\n        return lines.join(\"\\n\");\n    }\n\n    function rule(rule) {\n        var lines = [];\n        lines.push(\"\\t\" + JSON.stringify(rule.ident) + \": {\");\n        lines.push(\"\\t\\tident: \" + JSON.stringify(rule.ident) + \",\");\n        if (rule.parameters)\n            lines.push(\"\\t\\tparameters: \" + JSON.stringify(rule.parameters) + \",\");\n        if (rule.name)\n            lines.push(\"\\t\\tname: \" + JSON.stringify(rule.name) + \",\");\n        lines.push(\"\\t\\tbody: \" + rule.body + \",\");\n        lines.push(\"\\t}\");\n        return lines.join(\"\\n\");\n    }\n\n    function arrayToObject($) {\n        var res = {};\n        for (var i = 0, il = $.length; i < il; ++i)\n            res[$[i].ident] = $[i];\n        return res;\n    }\n\n    function ensureMin($) {\n        return $ === undefined ? 0 : $;\n    }\n\n    function ensureMax($) {\n        return $ === undefined ? Infinity : $;\n    }\n\n    function characterClassChar(str) {\n        var len = str.length;\n        if (len === 1)\n            return str.charCodeAt();\n        if (len === 4 || len === 6)\n            return parseInt(str.substring(2), 16);\n        if (str === \"\\\\0\")\n            return 0;\n        if (str === \"\\\\t\")\n            return 9;\n        if (str === \"\\\\n\")\n            return 10;\n        if (str === \"\\\\v\")\n            return 11;\n        if (str === \"\\\\f\")\n            return 12;\n        if (str === \"\\\\r\")\n            return 13;\n        return str.charCodeAt(1);\n    }\n\n    function nuturalNumber($) {\n        return +$;\n    }\n\n    function expr($) {\n        switch ($.op) {\n        case \"nop\":\n        case \"ac\":\n            return $.op + \"()\";\n        case \"oc\":\n        case \"seq\":\n            return $.op + \"([\" + $.a + \"])\";\n        case \"pr\":\n            return $.op + \"(\" + JSON.stringify($.a) + \",\" + $.b + \")\";\n        case \"mod\":\n        case \"grd\":\n            return $.op + \"(\" + $.a + \",\" + JSON.stringify($.b) + \",\" + JSON.stringify($.c) + \")\";\n        case \"str\":\n            return $.op + \"(\" + JSON.stringify($.a) + \")\";\n        case \"cc\":\n            return $.op + \"(\" + JSON.stringify($.a) + \",\" + JSON.stringify($.b) + \")\";\n        case \"ltr\":\n            return $.op + \"(\" + JSON.stringify($.a) + \")\";\n        case \"arr\":\n        case \"obj\":\n        case \"tkn\":\n        case \"pla\":\n        case \"nla\":\n        case \"wst\":\n            return $.op + \"(\" + $.a + \")\";\n        case \"rep\":\n            return $.op + \"(\" + $.a + \",\" + ($.b === \"min\" ? $.a : $.b) + \",\" + $.c + \")\";\n        case \"cv\":\n            return $.op + \"(\" + JSON.stringify($.a) + \")\";\n        case \"rul\":\n            if ($.b)\n                return $.op + \"(\" + JSON.stringify($.a) + \",[\" + $.b + \"])\";\n            else\n                return $.op + \"(\" + JSON.stringify($.a) + \")\";\n        }\n    }\n}\n\n\nstart\n    = {\n        __\n        initializer: (CodeBlock __ | \\\"\")\n        rules: @*Rule -> rules\n    }\n\nRule\n    = {\n        ident: Identifier __\n        ?(parameters: RuleParameters __)\n        ?(name: StringLiteral __)\n        '=' __\n        body: ChoiceExpression __\n    }\n\nRuleParameters\n    = @(\n        \"<\" __\n        ?(\n            Identifier __\n            *(\",\" __ Identifier __)\n        )\n        \">\"\n    )\n\nChoiceExpression\n    =   {\n            op:= oc\n            a: @(SequenceExpression __ +('|' __ SequenceExpression))\n        } -> expr\n        __\n    |   SequenceExpression\n        __\n\nSequenceExpression\n    =   {\n            op:= seq\n            a: @(LabelExpression +(__ LabelExpression))\n        } -> expr\n        __\n    |   LabelExpression\n        __\n\nLabelExpression\n    =   {\n				    op:= pr\n            a: IdentifierOrStringLiteral __\n            (\n                ':=' __\n                b: {\n                    op:= ltr\n                    a: IdentifierOrStringLiteral\n                } -> expr\n            |\n                ':' __\n                b: PipeExpression\n            )\n        }  -> expr\n    |   PipeExpression\n\nPipeExpression\n    =   {\n            a: PipeExpression __\n            '->' __\n            op:= mod\n            (b: Identifier c: \\null | b: \\null c: CodeBlock)\n        |\n            a: PipeExpression __\n            '-?' __\n            op:= grd\n            (b: Identifier c: \\null | b: \\null c: CodeBlock)\n        |\n            a: PipeExpression __\n            '-|'\n            op:=wst\n        } -> expr\n    |   OtherExpression\n\nOtherExpression\n    =   '(' __ (ChoiceExpression | {op:=nop} -> expr) __ ')'\n    |\n        {\n            op:= str\n            a: StringLiteral\n        |\n            op:= cc\n            '['\n            b: ('^' \\true | \\false)\n            a: CharacterClass\n            ']'\n        |\n            op:= ltr\n            '\\\\' __\n            a: Literal\n        |\n            op:= arr\n            '@' __\n            a: OtherExpression\n        |\n            op:= obj\n            '{' __\n            a: (ChoiceExpression | {op:=nop} -> expr) __\n            '}'\n        |\n            op:= tkn\n            '`' __\n            a: OtherExpression\n        |\n            op:= mod\n            '~' __\n            a: {\n                op:= arr\n                a: OtherExpression\n            } -> expr\n            b: \\null\n            c: \\'return $.join(\"\")'\n        |\n            op:= pla\n            '&' __\n            a: OtherExpression\n        |\n            op:= nla\n            '!' __\n            a: OtherExpression\n        |\n            op:= rep\n            '?' __\n            c: OtherExpression\n            a: \\0\n            b: \\1\n        |\n            op:= rep\n            '*' __\n            c: OtherExpression\n            a: \\0\n            b: \\0 -> { return Infinity }\n        |\n            op:= rep\n            a: NaturalNumber __\n            '*' __\n            c: OtherExpression\n            b: \\\"min\"\n        |\n            op:= rep\n            a: ?NaturalNumber -> ensureMin __\n            ',' __\n            b: ?NaturalNumber -> ensureMax __\n            '*' __\n            c: OtherExpression\n        |\n            op:= rep\n            '+' __\n            c: OtherExpression\n            a:\\1\n            b:\\0 -> { return Infinity }\n        |\n            op:= ac\n            '.'\n        |\n            op:= cv\n            '$'\n            a: Identifier\n        |\n            op:= rul\n            !Rule\n            a: Identifier\n            ?(__ b:RuleArguments)\n        } -> expr\n\nRuleArguments\n    = @(\n        \"<\" __\n        ?(\n            ChoiceExpression __\n            *(\",\" __ ChoiceExpression __)\n        )\n        \">\"\n    )\n\n__ \"white space\"\n    =   *([ \\t\\r\\n] | Comment)\n\nComment\n    =   '//'\n        *[^\\n]\n        ('\\n' | !.)\n    |   '/*'\n        *([^*] | '*' [^/])\n        '*/'\n\nLineTerminator\n    =   [\\n\\r\\u2028\\u2029]\n\nIdentifier \"identifier\"\n    =   `([a-zA-Z_] *[a-zA-Z0-9_])\n\nIdentifierOrStringLiteral\n    =   StringLiteral\n    |   Identifier\n\nStringLiteral \"string literal\"\n    =   `StringLiteralRaw -> eval\n\nStringLiteralRaw\n    =   '\\''\n        *(\n            !LineTerminator [^'\\\\]\n        |\n            '\\\\x' 2*HexDigit\n        |\n            '\\\\u' 4*HexDigit\n        |\n            '\\\\' [^ux]\n        )\n        '\\''\n    |   '\\\"'\n        *(\n            !LineTerminator [^\"\\\\]\n        |\n            '\\\\x' 2*HexDigit\n        |\n            '\\\\u' 4*HexDigit\n        |\n            '\\\\' [^ux]\n        )\n        '\\\"'\n\nCharacterClass\n    = @*{\n        type:= range\n        start: CharacterClassChar '-'\n        end: CharacterClassChar\n    |\n        type:= single\n        char: CharacterClassChar\n    }\n\nCharacterClassChar\n    = `(\n        [^\\]\\\\]\n    |\n        '\\\\x' 2*HexDigit\n    |\n        '\\\\u' 4*HexDigit\n    |\n        '\\\\' [^ux]\n    ) -> characterClassChar\n\nCodeBlock \"code block\"\n    =   \"{\" `Code \"}\"\n\nCode\n    =   *([^{}] | \"{\" Code \"}\")\n\nNaturalNumber \"natural number\"\n    =   `([1-9] *[0-9] | \"0\") -> nuturalNumber\n\n\nLiteral\n    =   StringLiteral\n    |   NumericLiteral\n    |   BooleanLiteral\n    |   NullLiteral\n    |   ArrayLiteral\n    |   ObjectLiteral\n\nArrayLiteral \"array literal\"\n    =   \"[\" __\n        @?(Literal *(__ \",\" __ Literal) __)\n        \"]\"\n\nObjectLiteral \"object literal\"\n    =   \"{\" __\n        @?(ObjectLiteralProperty *(__ \",\" __ ObjectLiteralProperty) __)\n            -> {\n                var ret = {};\n                for (var i = 0; i < $.length; ++i)\n                    ret[$[i].key] = $[i].value;\n                return ret;\n            }\n        \"}\"\n\nObjectLiteralProperty\n    = {\n        key: IdentifierOrStringLiteral __\n        \":\" __\n        value: Literal\n    }\n\nNullLiteral\n    =   \"null\" \\null\n\nBooleanLiteral\n    =   \"true\"  \\true\n    |   \"false\" \\false\n\nNumericLiteral \"numeric literal\"\n    =   `(?\"-\" (HexIntegerLiteral | DecimalLiteral)) -> eval\n\nDecimalLiteral\n    =   DecimalIntegerLiteral \".\" *DecimalDigit ?ExponentPart\n    |   \".\" +DecimalDigit ?ExponentPart\n    |   DecimalIntegerLiteral ?ExponentPart\n\nDecimalIntegerLiteral\n    =   \"0\"\n    |   NonZeroDigit *DecimalDigit\n\nDecimalDigit\n    =   [0-9]\n\nNonZeroDigit\n    =   [1-9]\n\nExponentPart\n    =   ExponentIndicator SignedInteger\n\nExponentIndicator\n    =   [eE]\n\nSignedInteger\n    =   ?[+-] +DecimalDigit\n\nHexIntegerLiteral\n    =   (\"0x\" | \"0X\") +HexDigit\n\nHexDigit\n    =   [0-9a-fA-F]",
	inputText: 'start = "hello world"'
},
];

examplesElm.onchange = function(e) {
	example(examplesElm.value);
};

example(0);

window.onbeforeunload = function(e) {
  return true;
};
