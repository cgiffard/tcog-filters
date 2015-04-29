/*global describe, it, before, expect*/

var chai = require("chai");
	chai.should(),
	expect = chai.expect;

var parse = require("../").parse;

describe("Parser", function() {

	describe("Property Assignment", function() {

		it("should be able to recognise property assignment", function() {

			var result = parse("> func");

			result.chains[0].filters.length.should.equal(1);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["assign"]).to.equal("func");
			});

		});

		it("should support extended property names", function() {

			var result = parse("> __abc_01923_ABC");

			result.chains[0].filters.length.should.equal(1);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["assign"]).to.equal("__abc_01923_ABC");
			});

		});

		it("should support chained property assignment", function() {

			var result = parse("> a > a");

			result.chains[0].filters.length.should.equal(2);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["assign"]).to.equal("a");
			});

		});

		it("should support chained property access less whitespace",function() {

			var result = parse(">a>a");

			result.chains[0].filters.length.should.equal(2);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["assign"]).to.equal("a");
			});

		});

	});

});