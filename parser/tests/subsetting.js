/*global describe, it, before, expect*/

var chai = require("chai");
	chai.should(),
	expect = chai.expect;

var parse = require("../").parse;

describe("Parser", function() {

	describe("Array Subsetting", function() {

		it("should be able to recognise array subsetting", function() {

			var result = parse("[1]");

			result.chains[0].filters.length.should.equal(1);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["subset"]).to.be.an("array");
				filter["subset"].length.should.equal(1);
				filter["subset"][0].should.be.an("object");
				filter["subset"][0]["index"].should.be.a("number");
				filter["subset"][0]["index"].should.equal(1);
			});

		});

		it("should be able to recognise multiple array subsets", function() {

			var result = parse("[1][1][1]");

			result.chains[0].filters.length.should.equal(3);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["subset"]).to.be.an("array");
				filter["subset"].length.should.equal(1);
				filter["subset"][0].should.be.an("object");
				filter["subset"][0]["index"].should.be.a("number");
				filter["subset"][0]["index"].should.equal(1);
			});

		});

		it("should be able to handle array subsets with multiple indices",
			function() {

			var result = parse("[0, 1, 2]");

			result.chains[0].filters.length.should.equal(1);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["subset"]).to.be.an("array");
				filter["subset"].length.should.equal(3);

				filter["subset"].forEach(function(subset, idx) {
					subset.should.be.an.object;
					subset.index.should.be.a.number;
					subset.index.should.equal(idx);
				});
			});

		});

		it("should be able to handle array subsets with ranges",
			function() {

			var result = parse("[0-1, 1-2, 2-3]");

			result.chains[0].filters.length.should.equal(1);
			result.chains[0].filters.forEach(function(filter) {
				expect(filter["subset"]).to.be.an("array");
				filter["subset"].length.should.equal(3);

				filter["subset"].forEach(function(subset, idx) {
					subset.should.be.an.object;
					subset.range.should.be.an.array;
					subset.range.length.should.equal(2);
					subset.range[0].should.equal(idx);
					subset.range[1].should.equal(idx + 1);
				});
			});

		});

		it ("should be able to handle array subsets with a mixture of " +
			"indices and ranges", function() {

			var result = parse("[0-1, 1, 2-3, 4]");

			result.chains[0].filters.length.should.equal(1);
			var subset = result.chains[0].filters[0].subset;

			subset.length.should.equal(4);

			subset[0].range.should.be.an.array;
			subset[1].index.should.be.a.number;
			subset[2].range.should.be.an.array;
			subset[3].index.should.be.a.number;

		});

		it ("should throw out junk ranges", function() {

			expect(function() { parse("[-0--]") }).to.throw(Error);
			expect(function() { parse("[2-]") }).to.throw(Error);
			expect(function() { parse("[3-2-1]") }).to.throw(Error);

		});

		it ("should throw out non-integer indices", function() {

			expect(function() { parse("[-2.22345]") }).to.throw(Error);
			expect(function() { parse("[1.2]") }).to.throw(Error);
			expect(function() { parse("[7.6234]") }).to.throw(Error);

		});

		it ("should throw out non-numbers and other content", function() {

			expect(function() { parse("[a]") }).to.throw(Error);
			expect(function() { parse("['1']") }).to.throw(Error);
			expect(function() { parse("[/test/]") }).to.throw(Error);

		});

	});

});