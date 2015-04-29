/*global describe, it, before, expect*/

var chai = require("chai");
	chai.should(),
	expect = chai.expect;

var runtime		= require("../"),
	behaviours	= require("../behaviour"),
	errors		= require("../errors");

describe("Runtime Behaviours", function() {

	describe("Function", function() {
		var fn = behaviours["function"];

		it( "should throw a NodeError when function does not exist",
			function() {

			expect (function() {
				fn(null, { "function": "non-exist" });
			}).to.throw(errors.FilterNodeError);

			try {
				fn(null, { "function": "non-exist" });

			} catch(e) {
				e.should.be.an.instanceOf(Error);
				e.should.be.an.instanceOf(errors.FilterNodeError);
				e.message.should.equal(
					"Function 'non-exist' does not exist in map.");
			}
		});

		it( "should appropriately execute a synchronous function",
			function(done) {

			runtime.registerFunction("01-local-fixture", function(prev) {
				prev.should.equal("abc");

				this.abc = "def";
				return "qwerty";
			});

			var ctx = {};

			fn.call(
				ctx,
				"abc",
				{ "function": "01-local-fixture" },
				function(value) {
					value.should.equal("qwerty");
					ctx.should.have.a.property("abc");
					ctx.abc.should.equal("def");

					done();
				});
		});

		it( "should appropriately execute an asynchronous function",
			function(done) {

			runtime.registerFunction(
				"02-local-fixture",
				function(prev, arg, cb) {
					prev.should.equal("abc");
					arg.should.equal("klmn");

					this.abc = "def";
					cb("qwerty");
				}, true);

			var ctx = {};

			fn.call(
				ctx,
				"abc",
				{ "function": "02-local-fixture", "arguments": ["klmn"] },
				function(value) {
					value.should.equal("qwerty");
					ctx.should.have.a.property("abc");
					ctx.abc.should.equal("def");

					done();
				});
		});

	});


	describe("Property Access", function() {
		var prop = behaviours["property"];

		it( "should throw a NodeError when given a null value",
			function() {

			expect (function() {
				prop(null, {});
			}).to.throw(errors.FilterNodeError);

			try {
				prop(null, {});

			} catch(e) {
				e.should.be.an.instanceOf(Error);
				e.should.be.an.instanceOf(errors.FilterNodeError);
				e.message.should.equal(
					"Can't extract property from null value.");
			}
		});


		it( "should throw a NodeError when asked to extract from a null value",
			function() {

			expect (function() {
				prop({ "abc": null }, { "property": ["abc", "def"] });
			}).to.throw(errors.FilterNodeError);

			try {
				prop({ "abc": null }, { "property": ["abc", "def"] });

			} catch(e) {
				e.should.be.an.instanceOf(Error);
				e.should.be.an.instanceOf(errors.FilterNodeError);
				e.message.should.equal(
					"Property 'abc' is null.");
			}
		});

		it( "should extract a singly nested value",
			function(done) {

			prop(
				{ "abc": "def" },
				{ "property": ["abc"] },
				function(val) {
					val.should.equal("def");
					done();
				});
		});

		it( "should extract a deeply nested value",
			function(done) {

			prop(
				{ "abc": { "def": { "ghi": "jklm" } } },
				{ "property": ["abc", "def", "ghi"] },
				function(val) {
					val.should.equal("jklm");
					done();
				});
		});

	});

	describe("Subsetting", function() {
		var sub = behaviours["subset"];

		it( "should throw a TypeError when given a null value or non-array",
			function() {

			expect (function() {
				sub(null, {});
			}).to.throw(errors.FilterTypeError);

			try {
				sub("abc", {});

			} catch(e) {
				e.should.be.an.instanceOf(Error);
				e.should.be.an.instanceOf(errors.FilterTypeError);
				e.message.should.equal(
					"The value piped to a subset must be an array.");
			}
		});

		it( "should throw a NodeError when given a bogus range",
			function() {

			var filter = {
				"subset": [
					{"range": [4]},
					{"range": [2]}
				]
			};

			expect (function() {
				sub([], filter);
			}).to.throw(errors.FilterNodeError);

			try {
				sub([], filter);

			} catch(e) {
				e.should.be.an.instanceOf(Error);
				e.should.be.an.instanceOf(errors.FilterNodeError);
				e.message.should.equal(
					"The specified range is invalid.");
			}
		});

		it( "should appropriately subset based on indices",
			function(done) {

			var filter = {
				"subset": [
					{"index": 0},
					{"index": 2},
					{"index": 4}
				]
			};

			var input	= [ 1, 2, 3, 4, 5, 6],
				expect	= [ 1, 3, 5 ];

			sub(input, filter, function(value) {
				value.length.should.equal(expect.length);

				expect.forEach(function(item, idx) {
					item.should.equal(value[idx]);
				});

				done();
			});
		});

		it( "should appropriately subset based on short ranges",
			function(done) {

			var filter = {
				"subset": [
					{"range": [4, 5]},
					{"range": [2, 3]}
				]
			};

			var input	= [ 1, 2, 3, 4, 5, 6],
				expect	= [ 5, 6, 3, 4 ];

			sub(input, filter, function(value) {
				value.length.should.equal(expect.length);

				expect.forEach(function(item, idx) {
					item.should.equal(value[idx]);
				});

				done();
			});
		});

		it( "should appropriately subset based on longer ranges",
			function(done) {

			var filter = {
				"subset": [
					{"range": [2, 10]},
					{"range": [2, 3]}
				]
			};

			var input	= [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
				expect	= [ 3, 4, 5, 6, 7, 8, 9, 10, 11, 3, 4 ];

			sub(input, filter, function(value) {
				value.length.should.equal(expect.length);

				expect.forEach(function(item, idx) {
					item.should.equal(value[idx]);
				});

				done();
			});
		});

		it( "should permit mixed ranges and indices",
			function(done) {

			var filter = {
				"subset": [
					{"range": [2, 10]},
					{"index": 5 },
					{"range": [2, 3]}
				]
			};

			var input	= [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
				expect	= [ 3, 4, 5, 6, 7, 8, 9, 10, 11, 6, 3, 4 ];

			sub(input, filter, function(value) {
				value.length.should.equal(expect.length);

				expect.forEach(function(item, idx) {
					item.should.equal(value[idx]);
				});

				done();
			});
		});
	});

	describe("Substitution", function() {
		var subs = behaviours["substitute"];

		it( "should throw a TypeError, given a null value or non-string/array",
			function() {

			var filter = {
				"substitute": {
					"find": "[a-z]",
					"replace": "#",
					"flags": "i"
				}
			};

			expect(function() {
				subs(null, filter);
			}).to.throw(errors.FilterTypeError);

			try {
				subs({}, filter);

			} catch(e) {
				e.should.be.an.instanceOf(Error);
				e.should.be.an.instanceOf(errors.FilterTypeError);
				e.message.should.equal(
					"Substitution requires a string or array.");
			}
		});

		it( "should appropriately perform a regex substitution on a string",
			function() {

			var filter = {
				"substitute": {
					"find": "[a-z]",
					"replace": "#",
					"flags": "ig"
				}
			};

			var input = "a1b2C3d4e5F6",
				expectation = "#1#2#3#4#5#6";

			subs(input, filter, function(result) {
				result.should.equal(expectation);
			});
		});

		it( "should appropriately perform a regex substitution on an array",
			function() {

			var filter = {
				"substitute": {
					"find": "[a-z]",
					"replace": "#",
					"flags": "ig"
				}
			};

			var input = [ "a1b2C3d4e5F6", "abc123" ],
				expectation = [ "#1#2#3#4#5#6", "###123" ];

			subs(input, filter, function(result) {
				expectation.forEach(function(expectation, idx) {
					result[idx].should.equal(expectation);
				});
			});
		});
	});

	describe("Matching", function() {
		var match = behaviours["match"];

		it( "should throw a TypeError, given a null value or non-string",
			function() {

			var filter = {
				"match": {
					"find": "[a-z]+",
					"flags": "i"
				}
			};

			expect (function() {
				match(null, filter);
			}).to.throw(errors.FilterTypeError);

			try {
				match({}, filter);

			} catch(e) {
				e.should.be.an.instanceOf(Error);
				e.should.be.an.instanceOf(errors.FilterTypeError);
				e.message.should.equal(
					"Matching requires a string.");
			}
		});

		it( "should return array of match groups",
			function(done) {

			var filter = {
				"match": {
					"find": "[a-z]+",
					"flags": "ig"
				}
			};

			var expectation = [ "abc", "def" ];

			match("123 abc 123 def", filter, function(value) {
				expectation.forEach(function(expectation, idx) {
					expectation.should.equal(value[idx]);
				});

				done();
			});
		});

	});

	describe("Property Assignment", function() {
		var assign = behaviours["assign"];

		it( "should throw a TypeError, given a null value or non-string",
			function() {

			var context = {},
				filter = {
					"assign": "abc"
				};

			expect(function() {
				assign(null, filter);
			}).to.throw(errors.FilterTypeError);

			try {
				assign(null, filter);

			} catch(e) {
				e.should.be.an.instanceOf(Error);
				e.should.be.an.instanceOf(errors.FilterTypeError);
				e.message.should.equal(
					"The value in the assignment must be useful. " +
					"(not null, truthy.)");
			}
		});

		it( "should appropriately assign values to the context",
			function() {

			var context = {},
				prev = "def",
				filter = {
					"assign": "abc"
				};

			assign.call(context, prev, filter, function(val) {
				expect(val).to.equal(prev);
				context.should.have.a.property("abc");
				context.abc.should.equal("def");
			});
		});

	});

	describe("Property Access", function() {
		var access = behaviours["access"];

		it( "should throw a TypeError, given a null value or non-string",
			function() {

			var context = {},
				filter = {
					"access": "abc"
				};

			expect(function() {
				access(null, filter);
			}).to.throw(errors.FilterTypeError);

			try {
				access(null, filter);

			} catch(e) {
				e.should.be.an.instanceOf(Error);
				e.should.be.an.instanceOf(errors.FilterTypeError);
				e.message.should.equal(
					"The value from which to access the property must be " +
					"useful. (not null, truthy.)");
			}
		});

		it( "should throw a TypeError, if a return value is null or not useful",
			function() {

			var context = {},
				prev = { "abc": null },
				filter = {
					"access": "abc"
				};

			expect(function() {
				access(prev, filter);
			}).to.throw(errors.FilterTypeError);

			try {
				access(prev, filter);

			} catch(e) {
				e.should.be.an.instanceOf(Error);
				e.should.be.an.instanceOf(errors.FilterTypeError);
				e.message.should.equal(
					"The returned value from the property access must be " +
					"useful. (not null, truthy.)");
			}
		});

		it( "should appropriately retrieve values from the context",
			function() {

			var context = {},
				prev = { "abc": "def" },
				filter = {
					"access": "abc"
				};

			access.call(context, prev, filter, function(val) {
				expect(val).to.equal(prev.abc);
			});
		});

	});
});