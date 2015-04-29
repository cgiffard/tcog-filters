/*global describe, it, before, expect*/

var chai = require("chai");
	chai.should(),
	expect = chai.expect;

var parse = require("../").parse;

describe("Parser", function() {

	describe("Matching", function() {

		it("should parse chained regular matches", function() {

			var result = parse("m/a/i | m/a/i | m/a/i");

			result.chains[0].filters.length.should.equal(3);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["match"]["find"]).to.equal("a");
				expect(filter["match"]["flags"]).to.equal("i");
			});

		});

		it("should parse regular expressions containing escaped slashes",
			function() {

			var result = parse("m/a\\/a/i | m/a\\/a/i | m/a\\/a/i");

			result.chains[0].filters.length.should.equal(3);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["match"]["find"]).to.equal("a\\/a");
				expect(filter["match"]["flags"]).to.equal("i");
			});

		});

		it("should parse complex regular expressions",
			function() {

			var result = parse("m/a_([a-z]{0,3})/ig | m/a_([a-z]{0,3})/ig");

			result.chains[0].filters.length.should.equal(2);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["match"]["find"]).to.equal("a_([a-z]{0,3})");
				expect(filter["match"]["flags"]).to.equal("ig");
			});

		});

		it("should permit no flags being set",
			function() {

			var result = parse("m/a_([a-z]{0,3})/ | m/a_([a-z]{0,3})/");

			result.chains[0].filters.length.should.equal(2);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["match"]["find"]).to.equal("a_([a-z]{0,3})");
				expect(filter["match"]["flags"]).to.equal("");
			});

		});

		it("should disallow empty expressions",
			function() {

			expect(function() { parse("m// | m//") }).to.throw(Error)

		});

	});

});