const EventEmitter = require("events");
const Bluebird = require("bluebird");
const Bottle = require("bottlejs");
const camelcase = require("camelcase");
const deepmerge = require("deepmerge");
const logging = require("./console");
const path = require("path");
const fs = require("fs");
const envConfig = require("./envConfig").envConfig;

const bottle = new Bottle(); //Module global DI container


module.exports = class FenghuangService extends EventEmitter {
    static get dependencies() {
        return [];
    }

    static get autoStart() {
        return true;
    }

    static get _defaultConfig() {
        return {};
    }

    static get _dependencies() {
        return this.autoStart ? ["FenghuangLoader", ...this.dependencies]: this.dependencies;
    }

    static _register() {
        logging.log(`Registering {yellow ${this.name}}`);
        bottle.service(this.name, this, ...this._dependencies);
    }

    static get instance() {
        return bottle.container[this.name];
    }

    constructor(...dependencyInstances) {
        super();
        logging.log(`Initializing {yellow ${this.constructor.name}}`);
        this.__injectDependencies(dependencyInstances);
        if(this.constructor.autoStart) {
            this._fenghuangLoader.on("loadFinished", () => this._start());
        }
    }

    _start() {
        logging.log(`Starting {yellow ${this.constructor.name}}`);
        return Bluebird.try(() => {
            if (this.start) {
                let config = this._getConfig();
                logging.debug(`Config for ${this.constructor.name}:\n${config}`);
                return this.start(config);
            }
        })
            .then(startResult => {
                this.emit("started");
                return startResult;
            });
    }

    _getGlobalConfig() {
        if (!this._fenghuangLoader) {
            logging.log("{yellow WARNING:} FenghuangLoader not present. Will not be able to get global config.");
            return;
        }
        return this._fenghuangLoader.globalConfig[this.constructor.name];
    }

    _getConfigFromFile() {
        const configFile = path.resolve(`${this.constructor.name}.json`);
        if (!fs.existsSync(configFile)) {
            return;
        }
        logging.debug(`Loading config from file: ${configFile}`);
        return require(configFile);
    }

    _getEnvConfig() {
        return envConfig[this.constructor.name];
    }

    _getConfig() {
        const globalConfig = this._getGlobalConfig();
        const fileConfig = this._getConfigFromFile();
        const envConfig = this._getEnvConfig();
        return deepmerge.all([this.constructor._defaultConfig, globalConfig, fileConfig, envConfig]);
    }

    __injectDependencies(dependencyInstances) {
        this.constructor._dependencies.forEach((dependency, index) => {
            this["_" + camelcase(dependency)] = dependencyInstances[index];
        });
    }
};