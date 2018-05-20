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

    describe("autoStart", function() {
        const FenghuangService = require(FILE_PATH);

        it("Should default to true", function() {
            expect(FenghuangService.autoStart).to.be.true;
        });
    });

    describe("_dependencies", function() {
        const FenghuangService = require(FILE_PATH);

        it("Should add FenghuangLoader if autoStart is true", function() {
            class TestWithAutoStart extends FenghuangService {
                static get dependencies() {
                    return [
                        "DependencyA",
                        "DependencyB"
                    ];
                }

                static get autoStart() {
                    return true;
                }
            }

            expect(TestWithAutoStart._dependencies).to.deep.equal(["FenghuangLoader", "DependencyA", "DependencyB"]);
        });

        it("Shouldn't add FenghuangLoader if autoStart is false", function() {
            class TestWithAutoStart extends FenghuangService {
                static get dependencies() {
                    return [
                        "DependencyA",
                        "DependencyB"
                    ];
                }

                static get autoStart() {
                    return false;
                }
            }

            expect(TestWithAutoStart._dependencies).to.deep.equal(["DependencyA", "DependencyB"]);
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
            static get _dependencies() {
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

        const EventEmitter = require("events");

        const FenghuangService = proxyquire(FILE_PATH, {
            "./console": logging
        });

        class TestService extends FenghuangService {
        }

        const fenghuangLoader = new EventEmitter(); //Fake FenghuangLoader

        beforeEach(function() {
            sandbox.stub(logging, "log");
            sandbox.stub(TestService.prototype, "__injectDependencies").callsFake(function() {
                this._fenghuangLoader = fenghuangLoader;
            });
            sandbox.stub(TestService.prototype, "_start");
            sandbox.stub(fenghuangLoader, "on");
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

        it("Should bind _start to fenghuangLoader loadFinished if autoStart is true", function() {
            class TestServiceWithAutoStart extends TestService {
                static get autoStart() {
                    return true;
                }
            }

            fenghuangLoader.on.withArgs("loadFinished").yields();

            const testService = new TestServiceWithAutoStart();

            expect(testService._start).to.have.been.calledOn(testService);
        });

        it("Should not _start to fenghuangLoader loadFinished if autoStart is false", function() {
            class TestServiceWithoutAutoStart extends TestService {
                static get autoStart() {
                    return false;
                }
            }

            fenghuangLoader.on.withArgs("loadFinished").yields();

            const testService = new TestServiceWithoutAutoStart();

            expect(testService._start).to.not.have.been.called;
        });
    });

    describe("_start", function() {
        const sandbox = sinon.sandbox.create();

        const logging = require("../lib/console");

        const FenghuangService = proxyquire(FILE_PATH, {
            "./console": logging
        });

        class TestService extends FenghuangService {
        }

        const testService = Object.create(TestService.prototype);

        beforeEach(function() {
            sandbox.stub(logging, "log");
            sandbox.stub(testService, "emit");
        });

        afterEach(function() {
            sandbox.reset();
            sandbox.restore();
        });

        it("Should log initializing message", function() {
            testService._start();
            expect(logging.log).to.have.been.calledWith("Starting {yellow TestService}");
        });

        it("Should emit started", function() {
            return testService._start()
                .then(() => {
                    expect(testService.emit).to.have.been.calledWith("started");
                });
        });

        describe("start present", function() {
            class TestServiceWithStart extends TestService {
                start() {

                }
            }

            const testServiceWithStart = Object.create(TestServiceWithStart.prototype);

            beforeEach(function() {
                sandbox.stub(testServiceWithStart, "start");
            });

            it("Should call start", function() {
                return testServiceWithStart._start()
                    .then(() => {
                        expect(testServiceWithStart.start).to.have.been.called;
                    });
            });

            it("Should return start result", function() {
                const startResult = {};
                testServiceWithStart.start.resolves(startResult);

                return expect(testServiceWithStart._start()).to.eventually.equal(startResult);
            });
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
            static get _dependencies() {
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