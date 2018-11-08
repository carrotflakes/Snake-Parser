var assert = require("assert");
var SnakeParser = require("../src/snakeParser");

describe("SnakeParser", function() {
	describe("invalid grammar", function() {
		it("Undefined rule 'start'", function() {
			assert.throws(function() {
				SnakeParser.buildParser('');
			}, Error, "Undefined rule 'start'.");
		});

		it("Illegal repeat expression", function() {
			assert.throws(function() {
				SnakeParser.buildParser('start = 2,1*.');
			}, Error);
		});

		it("Reference rule", function() {
			assert.throws(function() {
				SnakeParser.buildParser('start = a');
			}, Error);
			assert.throws(function() {
				SnakeParser.buildParser('start = a<>');
			}, Error);
			assert.throws(function() {
				SnakeParser.buildParser('start = a<"yo"> a<x, y> = x');
			}, Error);
			assert.throws(function() {
				SnakeParser.buildParser('start = a<"yo", "yo"> a<x> = x');
			}, Error);
		});

		it("Others", function() {
			assert.throws(function() {
				SnakeParser.buildParser('a b');
			}, Error);
			assert.throws(function() {
				SnakeParser.buildParser('{');
			}, Error);
			assert.throws(function() {
				SnakeParser.buildParser('}');
			}, Error);
			assert.throws(function() {
				SnakeParser.buildParser('start = ');
			}, Error);
			assert.throws(function() {
				SnakeParser.buildParser('start = "');
			}, Error);
			assert.throws(function() {
				SnakeParser.buildParser('start = [');
			}, Error);
			assert.throws(function() {
				SnakeParser.buildParser('start = ]');
			}, Error);
			assert.throws(function() {
				SnakeParser.buildParser('start = #');
			}, Error);
			assert.throws(function() {
				SnakeParser.buildParser('start = "yo" -> ');
			}, Error);
		});
	});

	describe("parsing", function() {
		it("Match", function() {
			var code = SnakeParser.buildParser('start = "yo"');
			var parse = eval(code);
			assert.equal(parse("yo"), undefined);
			assert.throws(parse.bind(null, ""), Error);
			assert.throws(parse.bind(null, "y"), Error);
			assert.throws(parse.bind(null, "yoo"), Error);
			assert.throws(parse.bind(null, "mo"), Error);

			var code = SnakeParser.buildParser('start = "y" "o"');
			var parse = eval(code);
			assert.equal(parse("yo"), undefined);
			assert.throws(parse.bind(null, ""), Error);
			assert.throws(parse.bind(null, "y"), Error);
			assert.throws(parse.bind(null, "yoo"), Error);
			assert.throws(parse.bind(null, "mo"), Error);

			var code = SnakeParser.buildParser('start = ..');
			var parse = eval(code);
			assert.equal(parse("yo"), undefined);
			assert.throws(parse.bind(null, ""), Error);
			assert.throws(parse.bind(null, "yoo"), Error);

			var code = SnakeParser.buildParser('start = [12b-d]');
			var parse = eval(code);
			assert.equal(parse("1"), undefined);
			assert.equal(parse("2"), undefined);
			assert.equal(parse("b"), undefined);
			assert.equal(parse("c"), undefined);
			assert.equal(parse("d"), undefined);
			assert.throws(parse.bind(null, "a"), Error);
			assert.throws(parse.bind(null, "e"), Error);

			var code = SnakeParser.buildParser('start = [^12b-d]');
			var parse = eval(code);
			assert.equal(parse("a"), undefined);
			assert.equal(parse("e"), undefined);
			assert.throws(parse.bind(null, "1"), Error);
			assert.throws(parse.bind(null, "2"), Error);
			assert.throws(parse.bind(null, "b"), Error);
			assert.throws(parse.bind(null, "c"), Error);
			assert.throws(parse.bind(null, "d"), Error);
		});

		it("Quantification", function() {
			var grammar = 'start = ?"a"';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse(""), undefined);
			assert.equal(parse("a"), undefined);
			assert.throws(parse.bind(null, "aa"), Error);

			var grammar = 'start = *"a"';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse(""), undefined);
			assert.equal(parse("a"), undefined);
			assert.equal(parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaa"), undefined);

			var grammar = 'start = +"a"';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse("a"), undefined);
			assert.equal(parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaa"), undefined);
			assert.throws(parse.bind(null, ""), Error);

			var grammar = 'start = 3*"a"';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse("aaa"), undefined);
			assert.throws(parse.bind(null, ""), Error);
			assert.throws(parse.bind(null, "a"), Error);
			assert.throws(parse.bind(null, "aa"), Error);
			assert.throws(parse.bind(null, "aaaa"), Error);

			var grammar = 'start = 1,3*"a"';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse("a"), undefined);
			assert.equal(parse("aaa"), undefined);
			assert.throws(parse.bind(null, ""), Error);
			assert.throws(parse.bind(null, "aaaa"), Error);
		});

		it("Control", function() {
			var grammar = 'start = &"a" .';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse("a"), undefined);
			assert.throws(parse.bind(null, ""), Error);
			assert.throws(parse.bind(null, "b"), Error);

			var grammar = 'start = !"a" .';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse("b"), undefined);
			assert.throws(parse.bind(null, ""), Error);
			assert.throws(parse.bind(null, "a"), Error);

			var grammar = 'start = `("a" | "bc" | "b") *.';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse("a"), "a");
			assert.equal(parse("bc"), "bc");
			assert.equal(parse("b"), "b");
			assert.throws(parse.bind(null, ""), Error);
		});

		it("Return value", function() {
			var grammar = 'start = `*.';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse("hello"), "hello");

			var grammar = 'start = \\-12.3e4';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse(""), -123000);

			var grammar = 'start = \\true';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse(""), true);

			var grammar = 'start = \\false';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse(""), false);

			var grammar = 'start = \\null';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse(""), null);

			var grammar = 'start = \\"yo"';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse(""), "yo");

			var grammar = 'start = \\[1, "2", [], {}, {a:3, b:"4"}]';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.deepEqual(parse(""), [1, "2", [], {}, {a:3, b:"4"}]);

			var grammar = 'start = @(`. `. `.)';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.deepEqual(parse("abc"), ["a", "b", "c"]);

			var grammar = 'start = { a:`. b:=yo "c":="d"}';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.deepEqual(parse("x"), {a:"x", b:"yo", c:"d"});

			var grammar = 'start = `*. -> { return $ + "!"; } -> { return $ + "?"; }';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse("yo"), "yo!?");

			var grammar = 'start = `*. -? { return $ === $.split("").reverse().join(""); }';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse("wow"), "wow");
			assert.throws(parse.bind(null, "yeah"), Error);

			var grammar = 'start = ~*`.';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse("yeah"), "yeah");

			var grammar = '{ function mod(x) { return x + "!"; } function assert(x) { return x === "yo!"; } }\n\
start = `*. -> mod -? assert';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse("yo"), "yo!");

			var grammar = 'start = @(\\1-| \\2 \\3-|)';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.deepEqual(parse(""), [2]);

			var grammar = 'start = *. $input';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse("hello"), "hello");

			var grammar = 'start = @($pos *. $pos)';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.deepEqual(parse("hello"), [0, 5]);

			var grammar = 'start = @($row $column *. $row $column)';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.deepEqual(parse("abc\ndef\rghi"), [0, 1, 2, 4]);
		});

		it("Parameterized rule", function() {
			var grammar = 'start = a<"a", "b"> a<x, y> = x y';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse("ab"), undefined);

			var grammar = 'start = a<b<b<"a">>, a<"b", "c">> a<x, y> = x b<y> b<x> = x x';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse("aaaabccbcc"), undefined);

			var grammar = 'start = a<"a"> a<a> = a';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse("a"), undefined);

			var grammar = 'start = a<\\"x"> a<x> = x->{return $}';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse(""), "x");
		});

		it("Recursive parameterized rule", function() {
			var grammar = 'start = a<"a"> a<x> = ?(x a<x>)';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse(""), undefined);
			assert.equal(parse("aaaaa"), undefined);

			var grammar = 'start = a<"a", "b"> a<x, y> = ?(x a<y, x>)';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.equal(parse(""), undefined);
			assert.equal(parse("ababa"), undefined);
		});

		it("Left recursive", function() {
			var grammar = 'start = a a = @?(a `.)';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.deepEqual(parse("ok!"), [[[[], "o"], "k"], "!"]);

			var grammar = 'start = a a = @?(b \\1 `.) b = @?(a \\2 `.)';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.deepEqual(parse("ok!"), [[[[], 1, "o"], 2, "k"], 1, "!"]);

			var grammar = 'start = a a = ?@(a b "!") b = ?@(b `[a-z])';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.deepEqual(parse("a!bc!d!"), [[[["a"]],[["b"],"c"]],["d"]]);

			var grammar = 'start = @a a = a `"+" | b | "1" b = b `"-" | a | "1"';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.deepEqual(parse("1++--+-"), ["+", "+", "-", "-", "+", "-"]);
		});
	});

	describe("optimization", function() {
		it("Literals", function() {
			var grammar = 'start = {a:\\"a" b:@(\\1 \\true \\null {} @())}';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.deepEqual(parse(""), {a:"a", b:[1, true, null, {}, []]});
		});

		it("SubtleLiterals", function() {
			var grammar = 'start = {a:() b:@3*\\0}';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.deepEqual(parse(""), {a:undefined, b:[0, 0, 0]});
		});
	});

	describe("infinite loop", function() {
		it("Infinite loop", function() {
			var grammar = 'start = *?"a"';
			var parse = eval(SnakeParser.buildParser(grammar));
			assert.throws(parse.bind(null, "a"), Error);
		});
	});
});
