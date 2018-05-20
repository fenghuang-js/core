const FILE_PATH = "../lib/FenghuangLoader";

const chai = require("chai");
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));
const expect = chai.expect;
const sinon = require("sinon");
const proxyquire = require("proxyquire").noPreserveCache(); //Using proxyquire all around to avoid require cache troubles.
process.env.NODE_ENV = "test";

describe("FenghuangLoader", function() {
    describe("autoStart", function() {
        const FenghuangLoader = proxyquire(FILE_PATH, {});

        it("Should set autoStart to false", function() {
            expect(FenghuangLoader.autoStart).to.be.false;
        });
    });

    describe("constructor", function() {
        const FenghuangLoader = proxyquire(FILE_PATH, {});

        it("Should initialize service to an empty object", function() {
            const fenghuangLoader = new FenghuangLoader();

            expect(fenghuangLoader.services).to.deep.equal({});
        });
    });

    describe("loadFromFile", function() {
        const sandbox = sinon.sandbox.create();

        const logging = require("../lib/console");

        const path = require("path");

        const fakedConfig = {
            dependencies: [],
            "@noCallThru": true
        };

        const FenghuangLoader = proxyquire(FILE_PATH, {
            console: logging,
            path: path,
            fakedConfig: fakedConfig
        });

        const fenghuangLoader = Object.create(FenghuangLoader.prototype);

        beforeEach(function() {
            fakedConfig.dependencies = [];
            sandbox.stub(path, "dirname").callsFake(function(file) {
                return `dirname(${file})`;
            });
            sandbox.stub(logging, "log");
            sandbox.stub(logging, "error");
            sandbox.stub(fenghuangLoader, "_recursiveLoad");
            sandbox.stub(fenghuangLoader, "_initializeServices");
            sandbox.stub(fenghuangLoader, "emit");
        });

        afterEach(function() {
            sandbox.reset();
            sandbox.restore();
        });

        it("Should log loading message", function() {
            fenghuangLoader.loadFromFile("fakedConfig");

            expect(logging.log).to.have.been.calledWith("Loading from {yellow fakedConfig}");
        });

        describe("No dependencies", function() {
            beforeEach(function() {
                delete fakedConfig.dependencies;
            });

            it("Should error log", function() {
                fenghuangLoader.loadFromFile("fakedConfig");

                expect(logging.error).to.have.been.calledWith("No dependencies defined. Aborting.");
            });

            it("Should not continue", function() {
                fenghuangLoader.loadFromFile("fakedConfig");

                expect(fenghuangLoader._recursiveLoad).to.not.have.been.called;
                expect(fenghuangLoader._initializeServices).to.not.have.been.called;
                expect(fenghuangLoader.emit).to.not.have.been.called;
            });
        });

        it("Should pass dependencies and base dirname to _recursiveLoad", function() {
            fakedConfig.dependencies = ["a", "b", "c"];

            fenghuangLoader.loadFromFile("fakedConfig");

            expect(fenghuangLoader._recursiveLoad).to.have.been.calledWith("dirname(fakedConfig)", fakedConfig.dependencies);
        });

        it("Should call _initializeServices after _recursiveLoad", function() {
            fenghuangLoader.loadFromFile("fakedConfig");

            expect(fenghuangLoader._initializeServices).to.have.been.calledAfter(fenghuangLoader._recursiveLoad);
        });

        it("Should emit loadFinished after calling _initializeServices", function() {
            fenghuangLoader.loadFromFile("fakedConfig");

            expect(fenghuangLoader.emit).to.have.been.calledAfter(fenghuangLoader._initializeServices);
            expect(fenghuangLoader.emit).to.have.been.calledWith("loadFinished");
        });
    });

    describe("_recursiveLoad", function() {
        const sandbox = sinon.sandbox.create();

        const glob = require("glob");

        const FenghuangLoader = proxyquire(FILE_PATH, {
            glob: glob
        });

        const fenghuangLoader = Object.create(FenghuangLoader.prototype);

        beforeEach(function() {
            sandbox.stub(glob, "sync").callsFake(function(inputGlob) {
                return [`globResult1:${inputGlob}`, `globResult2:${inputGlob}`];
            });
            sandbox.stub(fenghuangLoader, "_loadDependency");
        });

        afterEach(function() {
            sandbox.reset();
            sandbox.restore();
        });

        it("Should throw if recursion level is greater than 100", function() {
            function test() {
                fenghuangLoader._recursiveLoad("", [], 101);
            }

            expect(test).to.throw("Maximum recusion level 100 reached. Recursive loading too deep");
        });

        it("Should call glob.sync with dirname as the cwd", function() {
            const fakedDirName = "fakedDirName";

            fenghuangLoader._recursiveLoad(fakedDirName, ["aaa"]);

            expect(glob.sync).to.have.been.calledWith("aaa", {
                cwd: fakedDirName
            });
        });

        it("Should call _loadDependency for every glob resolved dependency", function() {
            fenghuangLoader._recursiveLoad("dirname", ["aaa", "bbb"], 2);

            expect(fenghuangLoader._loadDependency).to.have.been.calledWith("dirname", "globResult1:aaa", 2);
            expect(fenghuangLoader._loadDependency).to.have.been.calledWith("dirname", "globResult2:aaa", 2);
            expect(fenghuangLoader._loadDependency).to.have.been.calledWith("dirname", "globResult1:bbb", 2);
            expect(fenghuangLoader._loadDependency).to.have.been.calledWith("dirname", "globResult2:bbb", 2);
        });
    });

    describe("_loadDependency", function() {
        const sandbox = sinon.sandbox.create();

        const logging = require("../lib/console");

        const path = require("path");

        const fakedBaseConfig = {
            dependencies: [],
            entryPoint: "entryPoint",
            "@noCallThru": true
        };

        const fakedResolvedConfig = Object.assign({}, fakedBaseConfig, {
            resolved: true
        });

        const FenghuangLoader = proxyquire(FILE_PATH, {
            "join(fakedDependency,fenghuang.json)": fakedBaseConfig,
            "join(resolve(dirname,./fakedDependency),fenghuang.json)": fakedResolvedConfig,
            console: logging,
            path: path
        });

        const fenghuangLoader = Object.create(FenghuangLoader.prototype);

        beforeEach(function() {
            Object.assign(fakedBaseConfig, {
                dependencies: [],
                entryPoint: "entryPoint",
            });

            sandbox.stub(path, "resolve").callsFake(function(...args) {
                return `resolve(${args.join(",")})`;
            });
            sandbox.stub(path, "join").callsFake(function(...args) {
                return `join(${args.join(",")})`;
            });
            sandbox.stub(logging, "log");
            sandbox.stub(logging, "error");
            sandbox.stub(fenghuangLoader, "_recursiveLoad");
            sandbox.stub(fenghuangLoader, "_loadService");
        });

        afterEach(function() {
            sandbox.reset();
            sandbox.restore();
        });

        it("Should log loading message", function() {
            fenghuangLoader._loadDependency("dirname", "fakedDependency", 2);

            expect(logging.log).to.have.been.calledWith("    |-{yellow fakedDependency}");
        });

        describe("No entrypoint", function() {
            beforeEach(function() {
                delete fakedBaseConfig.entryPoint;
            });

            it("Should error log if there is no entryPoint", function() {
                fenghuangLoader._loadDependency("dirname", "fakedDependency", 2);

                expect(logging.error).to.have.been.calledWith("fakedDependency has no entry point. Aborting.");
            });

            it("Shouldn't continue", function() {
                fenghuangLoader._loadDependency("dirname", "fakedDependency", 2);

                expect(fenghuangLoader._loadService).to.not.have.been.called;
            });
        });

        it("Should call _loadService with the proper paths (base paths)", function() {
            fenghuangLoader._loadDependency("dirname", "fakedDependency", 2);

            expect(fenghuangLoader._loadService).to.have.been.calledWith("join(fakedDependency,entryPoint)");
        });

        it("Should call _loadService with the proper paths (resolved paths)", function() {
            fenghuangLoader._loadDependency("dirname", "./fakedDependency", 2);

            expect(fenghuangLoader._loadService).to.have.been.calledWith("join(resolve(dirname,./fakedDependency),entryPoint)");
        });

        it("Should _recursiveLoad for dependencies", function() {
            fakedBaseConfig.dependencies = ["aaa", "bbb"];

            fenghuangLoader._loadDependency("dirname", "fakedDependency", 2);

            expect(fenghuangLoader._recursiveLoad).to.have.been.calledWith("fakedDependency", fakedBaseConfig.dependencies, 3);
        });

        it("Shouldn't call _recursiveLoad if there are no dependencies", function() {
            delete fakedBaseConfig.dependencies;

            fenghuangLoader._loadDependency("dirname", "fakedDependency", 2);

            expect(fenghuangLoader._recursiveLoad).to.not.have.been.called;
        });
    });

    describe("_loadService", function() {
        const sandbox = sinon.sandbox.create();

        const logging = require("../lib/console");

        const FenghuangService = require("../lib/FenghuangService");

        class FakedService extends FenghuangService {

        }

        FakedService["@noCallThru"] = true;

        class FakedBadService {

        }

        FakedBadService["@noCallThru"] = true;

        const FenghuangLoader = proxyquire(FILE_PATH, {
            console: logging,
            "FakedService": FakedService,
            "FakedBadService": FakedBadService
        });

        const fenghuangLoader = Object.create(FenghuangLoader.prototype);

        beforeEach(function() {
            fenghuangLoader.services = {};
            sandbox.stub(logging, "log");
        });

        afterEach(function() {
            sandbox.reset();
            sandbox.restore();
        });

        it("Should register service", function() {
            fenghuangLoader._loadService("FakedService");

            expect(fenghuangLoader.services.fakedService).to.equal(FakedService);
        });

        it("Should log on \"invalid\" service", function() {
            fenghuangLoader._loadService("FakedBadService");

            expect(logging.log).to.have.been.calledWith("{yellow WARNING:} Entrypoint wasn't a Fenghuang Service. Will not register");
        });

        it("Shouldn't register \"invalid\" service", function() {

            fenghuangLoader._loadService("FakedBadService");

            expect(fenghuangLoader.services.fakedBadService).to.be.undefined;
        });
    });

    describe("_initializeServices", function() {
        const sandbox = sinon.sandbox.create();

        const FenghuangService = require("../lib/FenghuangService");

        class FakedServiceA extends FenghuangService {
        }

        class FakedServiceB extends FenghuangService {
        }

        const FenghuangLoader = proxyquire(FILE_PATH, {
        });

        const fenghuangLoader = Object.create(FenghuangLoader.prototype);

        const instanceAStub = sinon.stub();
        const instanceBStub = sinon.stub();

        beforeEach(function() {
            sandbox.replaceGetter(FakedServiceA, "instance", instanceAStub);
            sandbox.replaceGetter(FakedServiceB, "instance", instanceBStub);

            fenghuangLoader.services = {
                serviceA: FakedServiceA,
                serviceB: FakedServiceB
            };
        });

        afterEach(function() {
            instanceAStub.reset();
            instanceBStub.reset();

            sandbox.reset();
            sandbox.restore();
        });

        it("Should call instance getter of all services", function() {
            fenghuangLoader._initializeServices();

            expect(instanceAStub).to.have.been.called;
            expect(instanceBStub).to.have.been.called;
        });
    });
});