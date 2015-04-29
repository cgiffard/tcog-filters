/*global describe, it, before, expect*/

var chai = require("chai");
	chai.should(),
	expect = chai.expect;

var parse = require("../").parse;

describe("Parser", function() {

	describe("Functions", function() {

		it("should be able to recognise bare functions", function() {

			var result = parse("func");

			result.chains[0].filters.length.should.equal(1);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["function"]).to.equal("func");
			});

		});

		it("should be able to recognise functions with long names",
			function() {

			var result = parse("asdWERHHFHSUHFsdfhi8293479hsdf");

			result.chains[0].filters.length.should.equal(1);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["function"])
					.to.equal("asdWERHHFHSUHFsdfhi8293479hsdf");
			});

		});

		it("should be able to recognise function arguments", function() {

			var result = parse("func('a', \"b\", -123.45)");

			result.chains[0].filters.length.should.equal(1);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["function"]).to.equal("func");
				expect(filter["arguments"]).to.be.an("array");

				filter["arguments"][0].should.equal("a");
				filter["arguments"][1].should.equal("b");
				filter["arguments"][2].should.equal(-123.45);
			});

		});

		it("should not allow empty argument lists", function() {

			expect(function() { parse("func()") }).to.throw(Error)

		});

		it("should not allow barewords as function arguments",
			function() {

			expect(function() { parse("func(abc)") }).to.throw(Error)

		});

	});

});