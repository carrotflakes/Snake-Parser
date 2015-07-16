var snakeModifiers = {
	arrayToObject: function($) {
		var res = {};
		for (var i = 0, il = $.length; i < il; ++i)
			res[$[i].symbol] = $[i].body;
		return res;
	},
	omit: function($) {
		if ($.arg.length === 1)
			return $.arg[0];
		return $;
	},
	eval: function($) {
		return eval($);
	},
	characterClassChar: function($) {
		var str = $,
		len = str.length;
		if (len === 1) {
			return str.charCodeAt();
		} else if (len === 6) {
			return parseInt(str.substring(2), 16);
		} else if (str === "\\n"){
			return 10;
		} else if (str === "\\t"){
			return 9;
		} else if (str === "\\r"){
			return 13;
		}
		return str.charCodeAt(1);	// \0 とかの場合 0 を返すんだけど、これいらないかも。
	},
	nuturalNumber: function($) {
		return parseInt($);
	}
};

var snakeGrammarRules = {"start":{"op":"#","arg":{"op":" ","arg":[{"op":"$","arg":"__"},{"op":"?","arg":{"op":" ","arg":[
{"op":":","arg0":"initializer","arg1":{"op":"$","arg":"CodeBlock"}},{"op":"$","arg":"__"}]}},{"op":":","arg0":"rules","arg1":
{"op":">","arg0":{"op":"@","arg":{"op":"*","arg":{"op":"$","arg":"Rule"}}},"arg1":"arrayToObject"}}]}},"Rule":{"op":" ","arg":
[{"op":"#","arg":{"op":" ","arg":[{"op":":","arg0":"symbol","arg1":{"op":"$","arg":"Identifier"}},{"op":"$","arg":"__"},{"op":
"'","arg":"="},{"op":"$","arg":"__"},{"op":":","arg0":"body","arg1":{"op":"$","arg":"ChoiceExpression"}}]}},{"op":"$","arg":
"__"}]},"ChoiceExpression":{"op":" ","arg":[{"op":">","arg0":{"op":"#","arg":{"op":" ","arg":[{"op":":","arg0":"op","arg1":{
"op":"\\","arg":"|"}},{"op":":","arg0":"arg","arg1":{"op":"@","arg":{"op":" ","arg":[{"op":"$","arg":"SequenceExpression"},{
"op":"$","arg":"__"},{"op":"*","arg":{"op":" ","arg":[{"op":"'","arg":"|"},{"op":"$","arg":"__"},{"op":"$","arg":
"SequenceExpression"}]}}]}}}]}},"arg1":"omit"},{"op":"$","arg":"__"}]},"SequenceExpression":{"op":" ","arg":[{"op":">",
"arg0":{"op":"#","arg":{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":" "}},{"op":":","arg0":"arg","arg1":
{"op":"@","arg":{"op":" ","arg":[{"op":"$","arg":"LabelExpression"},{"op":"*","arg":{"op":" ","arg":[{"op":"$","arg":"__"},
{"op":"$","arg":"LabelExpression"}]}}]}}}]}},"arg1":"omit"},{"op":"$","arg":"__"}]},"LabelExpression":{"op":"|","arg":[
{"op":"#","arg":{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":":="}},{"op":":","arg0":"arg0","arg1":
{"op":"$","arg":"IdentifierOrStringLiteral"}},{"op":"$","arg":"__"},{"op":"'","arg":":="},{"op":"$","arg":"__"},{"op":":",
"arg0":"arg1","arg1":{"op":"$","arg":"IdentifierOrStringLiteral"}}]}},{"op":"#","arg":{"op":" ","arg":[{"op":":","arg0":"op",
"arg1":{"op":"\\","arg":":"}},{"op":":","arg0":"arg0","arg1":{"op":"$","arg":"IdentifierOrStringLiteral"}},{"op":"$","arg":
"__"},{"op":"'","arg":":"},{"op":"$","arg":"__"},{"op":":","arg0":"arg1","arg1":{"op":"$","arg":"ModifyExpression"}}]}},
{"op":"$","arg":"ModifyExpression"}]},"ModifyExpression":{"op":"|","arg":[{"op":"#","arg":{"op":" ","arg":[{"op":":","arg0":
"op","arg1":{"op":"\\","arg":">"}},{"op":":","arg0":"arg0","arg1":{"op":"$","arg":"ModifyExpression"}},{"op":"$","arg":"__"},
{"op":"'","arg":">"},{"op":"$","arg":"__"},{"op":"|","arg":[{"op":":","arg0":"arg1","arg1":{"op":"$","arg":"Identifier"}},
{"op":":","arg0":"arg2","arg1":{"op":"$","arg":"CodeBlock"}}]}]}},{"op":"$","arg":"OtherExpression"}]},"OtherExpression":
{"op":"|","arg":[{"op":" ","arg":[{"op":"'","arg":"("},{"op":"$","arg":"__"},{"op":"$","arg":"ChoiceExpression"},{"op":
"$","arg":"__"},{"op":"'","arg":")"}]},{"op":"#","arg":{"op":"|","arg":[{"op":" ","arg":[{"op":":","arg0":"op","arg1":
{"op":"\\","arg":"'"}},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"StringLiteral"}}]},{"op":" ","arg":[{"op":":","arg0":
"op","arg1":{"op":"\\","arg":"[^"}},{"op":"'","arg":"[^"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"CharacterClass"}},
{"op":"'","arg":"]"}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"["}},{"op":"'","arg":"["},{"op":":",
"arg0":"arg","arg1":{"op":"$","arg":"CharacterClass"}},{"op":"'","arg":"]"}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":
{"op":"\\","arg":"\\"}},{"op":"'","arg":"\\"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"|","arg":[{"op":
"$","arg":"StringLiteral"},{"op":"$","arg":"NumericLiteral"},{"op":"$","arg":"BooleanLiteral"},{"op":"$","arg":"NullLiteral"}
]}}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"@"}},{"op":"'","arg":"@"},{"op":"$","arg":"__"},{"op":
":","arg0":"arg","arg1":{"op":"$","arg":"OtherExpression"}}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":
"#"}},{"op":"'","arg":"{"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"ChoiceExpression"}},{"op":
"$","arg":"__"},{"op":"'","arg":"}"}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"`"}},{"op":"'","arg":
"`"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"OtherExpression"}}]},{"op":" ","arg":[{"op":
":","arg0":"op","arg1":{"op":"\\","arg":"&"}},{"op":"'","arg":"&"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":
{"op":"$","arg":"OtherExpression"}}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"!"}},{"op":"'","arg":
"!"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"OtherExpression"}}]},{"op":" ","arg":[{"op":
":","arg0":"op","arg1":{"op":"\\","arg":"?"}},{"op":"'","arg":"?"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":
{"op":"$","arg":"OtherExpression"}}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"*"}},{"op":"'",
"arg":"*"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"OtherExpression"}}]},{"op":" ","arg":[
{"op":":","arg0":"op","arg1":{"op":"\\","arg":"n"}},{"op":":","arg0":"n","arg1":{"op":"$","arg":"NaturalNumber"}},
{"op":"$","arg":"__"},{"op":"'","arg":"*"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"OtherExpression"}
}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"n-m"}},{"op":":","arg0":"n","arg1":{"op":">","arg0":{"op":
"?","arg":{"op":"$","arg":"NaturalNumber"}},"arg2":"return $ || 0"}},{"op":"'","arg":","},{"op":":","arg0":"m","arg1":{"op":">",
"arg0":{"op":"?","arg":{"op":"$","arg":"NaturalNumber"}},"arg2":"return $ || Infinity"}},{"op":"$","arg":"__"},{"op":"'","arg":
"*"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"OtherExpression"}}]},{"op":" ","arg":[{"op":":","arg0":
"op","arg1":{"op":"\\","arg":"+"}},{"op":"'","arg":"+"},{"op":"$","arg":"__"},{"op":":","arg0":"arg","arg1":{"op":"$","arg":
"OtherExpression"}}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"."}},{"op":"'","arg":"."}]},{"op":" ","arg":[{"op":":","arg0":"op","arg1":{"op":"\\","arg":"$"}},{"op":":","arg0":"arg","arg1":{"op":"$","arg":"Identifier"}},{"op":"!","arg":{"op":" ","arg":[{"op":"$","arg":"__"},{"op":"'","arg":"="}]}}]}]}}]},"__":{"op":"?","arg":{"op":"+","arg":{"op":"|","arg":[{"op":"[","arg":[{"type":"single","char":32},{"type":"single","char":9},{"type":"single","char":13},{"type":"single","char":10}]},{"op":"$","arg":"Comment"}]}}},"Comment":{"op":"|","arg":[{"op":" ","arg":[{"op":"'","arg":"//"},{"op":"*","arg":{"op":"[^","arg":[{"type":"single","char":10}]}},{"op":"|","arg":[{"op":"'","arg":"\n"},{"op":"!","arg":{"op":"."}}]}]},{"op":" ","arg":[{"op":"'","arg":"/*"},{"op":"*","arg":{"op":"|","arg":[{"op":"[^","arg":[{"type":"single","char":42}]},{"op":" ","arg":[{"op":"'","arg":"*"},{"op":"[^","arg":[{"type":"single","char":47}]}]}]}},{"op":"'","arg":"*/"}]}]},"Identifier":{"op":"`","arg":{"op":" ","arg":[{"op":"[","arg":[{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"single","char":95}]},{"op":"*","arg":{"op":"[","arg":[{"type":"range","start":97,"end":122},{"type":"range","start":65,"end":90},{"type":"range","start":48,"end":57},{"type":"single","char":95}]}}]}},"IdentifierOrStringLiteral":{"op":"|","arg":[{"op":"$","arg":"StringLiteral"},{"op":"$","arg":"Identifier"}]},"StringLiteral":{"op":">","arg0":{"op":"`","arg":{"op":"|","arg":[{"op":" ","arg":[{"op":"'","arg":"'"},{"op":"*","arg":{"op":"|","arg":[{"op":"+","arg":{"op":"[^","arg":[{"type":"single","char":39},{"type":"single","char":92}]}},{"op":" ","arg":[{"op":"'","arg":"\\u"},{"op":"n","n":4,"arg":{"op":"[","arg":[{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}]}}]},{"op":" ","arg":[{"op":"'","arg":"\\"},{"op":"[^","arg":[{"type":"single","char":117}]}]}]}},{"op":"'","arg":"'"}]},{"op":" ","arg":[{"op":"'","arg":"\""},{"op":"*","arg":{"op":"|","arg":[{"op":"+","arg":{"op":"[^","arg":[{"type":"single","char":34},{"type":"single","char":92}]}},{"op":" ","arg":[{"op":"'","arg":"\\u"},{"op":"n","n":4,"arg":{"op":"[","arg":[{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}]}}]},{"op":" ","arg":[{"op":"'","arg":"\\"},{"op":"[^","arg":[{"type":"single","char":117}]}]}]}},{"op":"'","arg":"\""}]}]}},"arg1":"eval"},"CharacterClass":{"op":"@","arg":{"op":"*","arg":{"op":"#","arg":{"op":"|","arg":[{"op":" ","arg":[{"op":":","arg0":"type","arg1":{"op":"\\","arg":"range"}},{"op":":","arg0":"start","arg1":{"op":"$","arg":"CharacterClassChar"}},{"op":"'","arg":"-"},{"op":":","arg0":"end","arg1":{"op":"$","arg":"CharacterClassChar"}}]},{"op":" ","arg":[{"op":":","arg0":"type","arg1":{"op":"\\","arg":"single"}},{"op":":","arg0":"char","arg1":{"op":"$","arg":"CharacterClassChar"}}]}]}}}},"CharacterClassChar":{"op":">","arg0":{"op":"`","arg":{"op":"|","arg":[{"op":"[^","arg":[{"type":"single","char":93},{"type":"single","char":92}]},{"op":" ","arg":[{"op":"'","arg":"\\u"},{"op":"n","n":4,"arg":{"op":"[","arg":[{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}]}}]},{"op":" ","arg":[{"op":"'","arg":"\\"},{"op":"[^","arg":[{"type":"single","char":117}]}]}]}},"arg1":"characterClassChar"},"CodeBlock":{"op":" ","arg":[{"op":"'","arg":"{"},{"op":"$","arg":"Code"},{"op":"'","arg":"}"}]},"Code":{"op":"`","arg":{"op":"*","arg":{"op":"|","arg":[{"op":"+","arg":{"op":" ","arg":[{"op":"!","arg":{"op":"[","arg":[{"type":"single","char":123},{"type":"single","char":125}]}},{"op":"."}]}},{"op":" ","arg":[{"op":"'","arg":"{"},{"op":"$","arg":"Code"},{"op":"'","arg":"}"}]}]}}},"NaturalNumber":{"op":">","arg0":{"op":"`","arg":{"op":"|","arg":[{"op":" ","arg":[{"op":"[","arg":[{"type":"range","start":49,"end":57}]},{"op":"*","arg":{"op":"[","arg":[{"type":"range","start":48,"end":57}]}}]},{"op":"'","arg":"0"}]}},"arg1":"nuturalNumber"},"NullLiteral":{"op":">","arg0":{"op":"`","arg":{"op":"'","arg":"null"}},"arg1":"eval"},"BooleanLiteral":{"op":">","arg0":{"op":"`","arg":{"op":"|","arg":[{"op":"'","arg":"true"},{"op":"'","arg":"false"}]}},"arg1":"eval"},"NumericLiteral":{"op":">","arg0":{"op":"`","arg":{"op":" ","arg":[{"op":"?","arg":{"op":"'","arg":"-"}},{"op":"|","arg":[{"op":"$","arg":"HexIntegerLiteral"},{"op":"$","arg":"DecimalLiteral"}]}]}},"arg1":"eval"},"DecimalLiteral":{"op":"|","arg":[{"op":" ","arg":[{"op":"$","arg":"DecimalIntegerLiteral"},{"op":"'","arg":"."},{"op":"*","arg":{"op":"$","arg":"DecimalDigit"}},{"op":"?","arg":{"op":"$","arg":"ExponentPart"}}]},{"op":" ","arg":[{"op":"'","arg":"."},{"op":"+","arg":{"op":"$","arg":"DecimalDigit"}},{"op":"?","arg":{"op":"$","arg":"ExponentPart"}}]},{"op":" ","arg":[{"op":"$","arg":"DecimalIntegerLiteral"},{"op":"?","arg":{"op":"$","arg":"ExponentPart"}}]}]},"DecimalIntegerLiteral":{"op":"|","arg":[{"op":"'","arg":"0"},{"op":" ","arg":[{"op":"$","arg":"NonZeroDigit"},{"op":"*","arg":{"op":"$","arg":"DecimalDigit"}}]}]},"DecimalDigit":{"op":"[","arg":[{"type":"range","start":48,"end":57}]},"NonZeroDigit":{"op":"[","arg":[{"type":"range","start":49,"end":57}]},"ExponentPart":{"op":" ","arg":[{"op":"$","arg":"ExponentIndicator"},{"op":"$","arg":"SignedInteger"}]},"ExponentIndicator":{"op":"|","arg":[{"op":"'","arg":"e"},{"op":"'","arg":"E"}]},"SignedInteger":{"op":" ","arg":[{"op":"?","arg":{"op":"[","arg":[{"type":"single","char":43},{"type":"single","char":45}]}},{"op":"+","arg":{"op":"$","arg":"DecimalDigit"}}]},"HexIntegerLiteral":{"op":" ","arg":[{"op":"|","arg":[{"op":"'","arg":"0x"},{"op":"'","arg":"0X"}]},{"op":"+","arg":{"op":"$","arg":"HexDigit"}}]},"HexDigit":{"op":"[","arg":[{"type":"range","start":48,"end":57},{"type":"range","start":97,"end":102},{"type":"range","start":65,"end":70}]}};

var Parser = require("./parserObject");

module.exports = new Parser(snakeGrammarRules, snakeModifiers);
