const Bottle = require("bottlejs");
const camelcase = require("camelcase");
const logging = require("./console");

const bottle = new Bottle(); //Module global DI container

module.exports = class FenghuangService {
    static get dependencies() {
        return [];
    }

    static _register() {
        logging.log(`Registering {yellow ${this.name}}`);
        bottle.service(this.name, this, ...this.dependencies);
    }

    static get instance() {
        return bottle.container[this.name];
    }

    constructor(...dependencyInstances) {
        logging.log(`Initializing {yellow ${this.constructor.name}}`);
        this.__injectDependencies(dependencyInstances);
    }

    start() {
        logging.log(`Starting {yellow ${this.constructor.name}}`);
    }

    __injectDependencies(dependencyInstances) {
        this.constructor.dependencies.forEach((dependency, index) => {
            this["_" + camelcase(dependency)] = dependencyInstances[index];
        });
    }
};