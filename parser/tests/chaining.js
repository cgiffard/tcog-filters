/*global describe, it, before, expect*/

var chai = require("chai");
	chai.should(),
	expect = chai.expect;

var parse = require("../").parse;

describe("Parser", function() {

	describe("Chaining", function() {

		it("should be able to chain multiple functions together", function() {

			var result = parse("func | func | func");

			result.chains[0].filters.length.should.equal(3);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["function"]).to.equal("func");
			});

		});

		it("should be able to chain multiple different constructs together",
			function() {

			var result = parse("func | [ 1-2, 3-4 ] | < blah");

			result.chains[0].filters.length.should.equal(3);
			expect(result.chains[0].filters[0]["function"]).to.equal("func");
			expect(result.chains[0].filters[1]["subset"]).to.be.an("array");
			expect(result.chains[0].filters[2]["access"]).to.equal("blah");

		});

		it("should allow pipes to be omitted for property access", function() {

			var result = parse("< func < func < func");

			result.chains[0].filters.length.should.equal(3);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["access"]).to.equal("func");
			});

		});

		it("should allow pipes to be omitted for array subsetting", function() {

			var result = parse("[ 1-2 ] [ 1-2 ] [ 1-2 ]");

			result.chains[0].filters.length.should.equal(3);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["subset"]).to.be.an("array");
			});

		});

		it("should allow pipes to be omitted for property assignment",
			function() {

			var result = parse("> a > a > a");

			result.chains[0].filters.length.should.equal(3);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["assign"]).to.equal("a");
			});

		});

		it("should support multiple chains", function() {

			var result = parse("a, b, c"),
				names = ["a", "b", "c"];

			result.chains.length.should.equal(3);
			result.chains.forEach(function(chain, idx) {
				chain.filters.forEach(function(filter) {
					filter["function"].should.equal(names[idx]);
				});
			})

		});

	});

});