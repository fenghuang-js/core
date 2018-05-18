const FILE_PATH = "../lib/FenghuangService";

const chai = require("chai");
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));
const expect = chai.expect;
const sinon = require("sinon");
const proxyquire = require("proxyquire");
process.env.NODE_ENV = "test";

describe("FenghuangService", function() {
    describe("dependencies", function() {
        const FenghuangService = require(FILE_PATH);

        it("Should default to an empty array", function() {
            expect(FenghuangService.dependencies).to.deep.equal([]);
        });
    });

    describe("register", function() {
        const sandbox = sinon.sandbox.create();

        const Bottle = require("bottlejs");
        const logging = require("../lib/console");

        const FenghuangService = proxyquire(FILE_PATH, {
            "bottlejs": Bottle,
            "./console": logging
        });

        class TestService extends FenghuangService {
            static get dependencies() {
                return [
                    "a",
                    "b",
                    "c"
                ];
            }
        }

        beforeEach(function() {
            sandbox.stub(Bottle.prototype, "service");
            sandbox.stub(logging, "log");
        });

        afterEach(function() {
            sandbox.reset();
            sandbox.restore();
        });

        it("Should log registing message", function() {
            TestService._register();
            expect(logging.log).to.have.been.calledWith("Registering {yellow TestService}");
        });

        it("Should register service", function() {
            TestService._register();
            expect(Bottle.prototype.service).to.have.been.calledWith("TestService", TestService, "a", "b", "c");
        });
    });

    describe("instance", function() {
        class Bottle {
            get container() {
                return {
                    TestService: "TestServiceInstance"
                };
            }
        }

        const FenghuangService = proxyquire(FILE_PATH, {
            "bottlejs": Bottle
        });

        class TestService extends FenghuangService {
        }

        it("Should return service instance from container", function() {
            expect(TestService.instance).to.equal("TestServiceInstance");
        });
    });

    describe("constructor", function() {
        const sandbox = sinon.sandbox.create();

        const logging = require("../lib/console");

        const FenghuangService = proxyquire(FILE_PATH, {
            "./console": logging
        });

        class TestService extends FenghuangService {
        }

        beforeEach(function() {
            sandbox.stub(logging, "log");
            sandbox.stub(FenghuangService.prototype, "__injectDependencies");
        });

        afterEach(function() {
            sandbox.reset();
            sandbox.restore();
        });

        it("Should log initializing message", function() {
            new TestService();
            expect(logging.log).to.have.been.calledWith("Initializing {yellow TestService}");
        });

        it("Should call __injectDependencies with the arguments", function() {
            const testService = new TestService("a", "b", "c");
            expect(testService.__injectDependencies).to.have.been.calledWith(["a", "b", "c"]);
        });
    });

    describe("start", function() {
        const sandbox = sinon.sandbox.create();

        const logging = require("../lib/console");

        const FenghuangService = proxyquire(FILE_PATH, {
            "./console": logging
        });

        beforeEach(function() {
            sandbox.stub(logging, "log");
        });

        afterEach(function() {
            sandbox.reset();
            sandbox.restore();
        });

        class TestService extends FenghuangService {
        }

        const testService = Object.create(TestService.prototype);

        it("Should log initializing message", function() {
            testService.start();
            expect(logging.log).to.have.been.calledWith("Starting {yellow TestService}");
        });
    });

    describe("__injectDependencies", function() {
        const camelcase = sinon.stub().callsFake(function(string) {
            return `camelcase(${string})`;
        });

        const FenghuangService = proxyquire(FILE_PATH, {
            "camelcase": camelcase
        });

        class TestService extends FenghuangService {
            static get dependencies() {
                return [
                    "a",
                    "b",
                    "c"
                ];
            }
        }

        const testService = Object.create(TestService.prototype);

        it("Should inject service instances in current instance", function() {
            const a = {};
            const b = {};
            const c = {};
            testService.__injectDependencies([a, b, c]);
            expect(testService["_camelcase(a)"]).to.equal(a);
            expect(testService["_camelcase(b)"]).to.equal(b);
            expect(testService["_camelcase(c)"]).to.equal(c);
        });
    });
});