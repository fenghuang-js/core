const FenghuangService = require("./FenghuangService");
const camelcase = require("camelcase");
const logging = require("./console");
const glob = require("glob");
const path = require("path");

const MAX_RECURSION = 100;

class FenghuangLoader extends FenghuangService {
    static get autoStart() {
        return false;
    }

    constructor() {
        super();
        this.services = {};
    }

    loadFromFile(fileName) {
        logging.log(`Loading from {yellow ${fileName}}`);
        const config = require(fileName);
        if (!Array.isArray(config.dependencies)) {
            logging.error("No dependencies defined. Aborting.");
            return;
        }

        this._recursiveLoad(path.dirname(fileName), config.dependencies);
        this._initializeServices();
        this.emit("loadFinished");
    }

    _recursiveLoad(dirname, dependencies, recursionLevel) {
        recursionLevel = recursionLevel || 1;
        if (recursionLevel > MAX_RECURSION) {
            throw new Error(`Maximum recusion level ${MAX_RECURSION} reached. Recursive loading too deep`);
        }
        dependencies.forEach(dependency => {
            glob.sync(dependency, {
                cwd: dirname
            }).forEach(dependency => this._loadDependency(dirname, dependency, recursionLevel));
        });
    }

    _loadDependency(dirname, dependency, recursionLevel) {
        logging.log(`${"  ".repeat(recursionLevel)}|-{yellow ${dependency}}`);
        const dependencyPath = dependency.charAt(0) === "." ? path.resolve(dirname, dependency) : dependency;
        const dependencyConfig = require(path.join(dependencyPath, "fenghuang.json"));
        if (!dependencyConfig.entryPoint) {
            logging.error(`${dependency} has no entry point. Aborting.`);
            return;
        }

        this._loadService(path.join(dependencyPath, dependencyConfig.entryPoint));
        if (Array.isArray(dependencyConfig.dependencies)) {
            this._recursiveLoad(dependencyPath, dependencyConfig.dependencies, recursionLevel + 1);
        }
    }

    _loadService(entryPoint) {
        const service = require(entryPoint);
        if (!(service.prototype instanceof FenghuangService)) {
            logging.log("{yellow WARNING:} Entrypoint wasn't a Fenghuang Service. Will not register");
            return;
        }
        this.services[camelcase(service.name)] = service;
    }

    _initializeServices() {
        Object.keys(this.services).forEach(service => {
            this.services[service].instance;
        });
    }
}

FenghuangLoader._register();

module.exports = FenghuangLoader;