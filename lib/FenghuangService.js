const EventEmitter = require("events");
const Bluebird = require("bluebird");
const Bottle = require("bottlejs");
const camelcase = require("camelcase");
const logging = require("./console");

const bottle = new Bottle(); //Module global DI container

module.exports = class FenghuangService extends EventEmitter {
    static get dependencies() {
        return [];
    }

    static get autoStart() {
        return true;
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
                return this.start();
            }
        })
            .then(startResult => {
                this.emit("started");
                return startResult;
            });
    }

    __injectDependencies(dependencyInstances) {
        this.constructor._dependencies.forEach((dependency, index) => {
            this["_" + camelcase(dependency)] = dependencyInstances[index];
        });
    }
};