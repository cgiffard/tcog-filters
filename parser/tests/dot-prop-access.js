/*global describe, it, before, expect*/

var chai = require("chai");
	chai.should(),
	expect = chai.expect;

var parse = require("../").parse;

describe("Parser", function() {

	describe("Dot-Property Access", function() {

		it("should be able to recognise dot-property access", function() {

			var result = parse(".func");

			result.chains[0].filters.length.should.equal(1);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["property"]).to.be.an("array");
				filter["property"].length.should.equal(1);
				filter["property"][0].should.equal("func");
			});

		});

		it("should be able to recognise dot-property access", function() {

			var result = parse(".func.c.d.e");

			result.chains[0].filters.length.should.equal(1);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["property"]).to.be.an("array");
				filter["property"].length.should.equal(4);
				filter["property"][0].should.equal("func");
				filter["property"][1].should.equal("c");
				filter["property"][2].should.equal("d");
				filter["property"][3].should.equal("e");
			});

		});

		it ("should support dot-property access directly abutting a prior " +
			"chained element", function() {

			var result = parse("func.a, [ 1-2 ].0");

			result.chains[0].filters.length.should.equal(2);
			result.chains[0].filters[0]["function"].should.equal("func");
			result.chains[0].filters[1]["property"].should.be.an("array");
			result.chains[0].filters[1]["property"][0].should.equal("a");

			result.chains[1].filters.length.should.equal(2);
			result.chains[1].filters[0]["subset"].should.be.an("array");
			result.chains[1].filters[1]["property"].should.be.an("array");
			result.chains[1].filters[1]["property"][0].should.equal("0");

		});

	});

});