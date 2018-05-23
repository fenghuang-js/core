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

    describe("_defaultConfig", function() {
        const FenghuangService = require(FILE_PATH);

        it("Should default to an empty object", function() {
            expect(FenghuangService._defaultConfig).to.deep.equal({});
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
            sandbox.stub(logging, "debug");
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
                sandbox.stub(testServiceWithStart, "_getConfig").returns("FakedConfig");
            });

            it("Should debug log config", function() {
                testServiceWithStart._start();

                expect(logging.debug).to.have.been.calledWith("Config for TestServiceWithStart:\nFakedConfig");
            });

            it("Should call start with the config", function() {
                return testServiceWithStart._start()
                    .then(() => {
                        expect(testServiceWithStart.start).to.have.been.calledWith("FakedConfig");
                    });
            });

            it("Should return start result", function() {
                const startResult = {};
                testServiceWithStart.start.resolves(startResult);

                return expect(testServiceWithStart._start()).to.eventually.equal(startResult);
            });
        });
    });

    describe("_getGlobalConfig", function() {
        const sandbox = sinon.sandbox.create();

        const logging = require("../lib/console");

        const FenghuangService = proxyquire(FILE_PATH, {
            "./console": logging
        });

        class TestService extends FenghuangService {
        }

        const testService = Object.create(TestService.prototype);

        beforeEach(function() {
            testService._fenghuangLoader = {
                globalConfig: {
                    TestService: {}
                }
            };

            sandbox.stub(logging, "log");
        });

        afterEach(function() {
            sandbox.reset();
            sandbox.restore();
        });

        it("Should log if FenghuangLoader is not present", function() {
            delete testService._fenghuangLoader;

            testService._getGlobalConfig();

            expect(logging.log).to.have.been.calledWith("{yellow WARNING:} FenghuangLoader not present. Will not be able to get global config.");
        });

        it("Should return global config if FenghuangLoader is present", function() {
            expect(testService._getGlobalConfig()).to.equal(testService._fenghuangLoader.globalConfig.TestService);
        });
    });

    describe("_getConfigFromFile", function() {
        const sandbox = sinon.sandbox.create();

        const fs = require("fs");

        const path = require("path");

        const logging = require("../lib/console");

        const fakedConfig = {
            "@noCallThru": true
        };

        const FenghuangService = proxyquire(FILE_PATH, {
            "logging": logging,
            "fs": fs,
            "path": path,
            "resolve(GoodFile.json)": fakedConfig
        });

        class GoodFile extends FenghuangService {
        }

        class BadFile extends FenghuangService {
        }

        const goodFileService = Object.create(GoodFile.prototype);
        const badFileService = Object.create(BadFile.prototype);

        beforeEach(function() {
            sandbox.stub(path, "resolve").callsFake(function(...args) {
                return `resolve(${args.join(",")})`;
            });
            sandbox.stub(fs, "existsSync").callsFake(function(fileName) {
                return !(fileName === "resolve(BadFile.json)");
            });
            sandbox.stub(logging, "debug");
        });

        afterEach(function() {
            sandbox.reset();
            sandbox.restore();
        });

        it("Shouldn't continue if the file doesn't exist", function() {
            badFileService._getConfigFromFile();

            expect(logging.debug).to.not.have.been.called;
        });

        it("Should debug log if the file exists", function() {
            goodFileService._getConfigFromFile();

            expect(logging.debug).to.have.been.calledWith("Loading config from file: resolve(GoodFile.json)");
        });

        it("Should return config if the file exists", function() {
            expect(goodFileService._getConfigFromFile()).to.equal(fakedConfig);
        });
    });

    describe("_getEnvConfig", function() {
        const envConfig = {
            envConfig: {
                TestService: {}
            }
        };

        const FenghuangService = proxyquire(FILE_PATH, {
            "./envConfig": envConfig
        });

        class TestService extends FenghuangService {
        }

        const testService = Object.create(TestService.prototype);

        it("Should return config from envConfig", function() {
            expect(testService._getEnvConfig()).to.equal(envConfig.envConfig.TestService);
        });
    });

    describe("_getConfig", function() {
        const sandbox = sinon.sandbox.create();

        const deepmerge = require("deepmerge");

        const FenghuangService = proxyquire(FILE_PATH, {
            "deepmerge": deepmerge
        });

        class TestService extends FenghuangService {
        }

        const testService = Object.create(TestService.prototype);

        beforeEach(function() {
            sandbox.stub(testService, "_getGlobalConfig").returns("globalConfig");
            sandbox.stub(testService, "_getConfigFromFile").returns("configFromFile");
            sandbox.stub(testService, "_getEnvConfig").returns("envConfig");
            sandbox.stub(TestService, "_defaultConfig").get(function() {
                return "_defaultConfig";
            });
            sandbox.stub(deepmerge, "all").callsFake(function(toMerge) {
                return `deepmerge(${toMerge.join(",")})`;
            });
        });

        afterEach(function() {
            sandbox.reset();
            sandbox.restore();
        });

        it("Should return merged config", function() {
            expect(testService._getConfig()).to.equal("deepmerge(_defaultConfig,globalConfig,configFromFile,envConfig)");
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