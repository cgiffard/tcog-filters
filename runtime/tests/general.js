/*global describe, it, before, expect*/

var chai = require("chai");
	chai.should(),
	expect = chai.expect;

var runtime = require("../"),
	functions = require("../functions"),
	errors = require("../errors");

describe("Runtime", function() {

	// Fixtures for tests
	runtime.registerFunction("fixture", function() {
		return {
			"abc": "def",
			"qrs": "tuv"
		};
	});

	describe("General", function() {

		it( "should be able to parse a chain and execute it to " +
			"retrieve a value", function(done) {

			runtime.execute("fixture.abc > abc", {}, function(values, context) {

				values.length.should.equal(1);
				values[0].should.be.a.string;
				values[0].should.equal("def");

				context.should.have.property("abc");
				context.abc.should.equal("def");

				done();
			});

		});

		it( "should be able to parse multiple chains and execute them to " +
			"retrieve a many values", function(done) {

			runtime.execute(
				"fixture.abc > abc, fixture < qrs > qwerty", {},
				function(values, context) {

				values.length.should.equal(2);
				values[0].should.be.a.string;
				values[0].should.equal("def");
				values[1].should.be.a.string;
				values[1].should.equal("tuv");

				context.should.have.property("abc");
				context.abc.should.equal("def");
				context.should.have.property("qwerty");
				context.qwerty.should.equal("tuv");

				done();
			});

		});

		it( "should be able to register new functions", function() {

			var abc = function() {};
			runtime.registerFunction("test-01", abc, true);

			functions.should.have.property("test-01");
			functions["test-01"].should.be.a("function");
			functions["test-01"].should.equal(abc)
			functions["test-01"].async.should.be.true;
		});

		it( "should throw a FilterError on duplicate function registration",
			function() {

			var abc = function() {};
			expect(function() {
				runtime.registerFunction("test-01", abc, true);
			}).to.throw(errors.FilterError);
		});

	});

});