/*global describe, it, before, expect*/

var chai = require("chai");
	chai.should(),
	expect = chai.expect;

var parse = require("../").parse;

describe("Parser", function() {

	describe("Substitution", function() {

		it("should parse chained regular substitutions", function() {

			var result = parse("s/a/b/i | s/a/b/i | s/a/b/i");

			result.chains[0].filters.length.should.equal(3);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["substitute"]["find"]).to.equal("a");
				expect(filter["substitute"]["replace"]).to.equal("b");
				expect(filter["substitute"]["flags"]).to.equal("i");
			});

		});

		it("should parse substitutions containing escaped slashes",
			function() {

			var result = parse("s/a\\/a/b\\/b/i | s/a\\/a/b\\/b/i");

			result.chains[0].filters.length.should.equal(2);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["substitute"]["find"]).to.equal("a\\/a");
				expect(filter["substitute"]["replace"]).to.equal("b\\/b");
				expect(filter["substitute"]["flags"]).to.equal("i");
			});

		});

		it("should parse complex regular expressions",
			function() {

			var result =
				parse("s/a_([a-z]{0,3})/b_$1/ig | s/a_([a-z]{0,3})/b_$1/ig");

			result.chains[0].filters.length.should.equal(2);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["substitute"]["find"]).to.equal("a_([a-z]{0,3})");
				expect(filter["substitute"]["replace"]).to.equal("b_$1");
				expect(filter["substitute"]["flags"]).to.equal("ig");
			});

		});

		it("should permit no flags being set",
			function() {

			var result =
				parse("s/a_([a-z]{0,3})/b_$1/ | s/a_([a-z]{0,3})/b_$1/");

			result.chains[0].filters.length.should.equal(2);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["substitute"]["find"]).to.equal("a_([a-z]{0,3})");
				expect(filter["substitute"]["replace"]).to.equal("b_$1");
				expect(filter["substitute"]["flags"]).to.equal("");
			});

		});

		it("should disallow empty expressions",
			function() {

			expect(function() { parse("s/// | s///") }).to.throw(Error);

		});

	});

});