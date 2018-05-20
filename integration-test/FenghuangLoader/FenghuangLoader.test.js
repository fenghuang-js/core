const path = require("path");
const chai = require("chai");
const expect = chai.expect;
process.env.NODE_ENV = "test";

describe("FenghuangLoader", function() {
    let FenghuangLoader;

    beforeEach(function() {
        FenghuangLoader = require("../../lib/FenghuangLoader");
    });

    afterEach(function() {
        //Clear the DI cache
        delete require.cache[require.resolve("../../lib/FenghuangLoader")];
        delete require.cache[require.resolve("../../lib/FenghuangService")];
    });

    it("Should load all services", function() {
        const fenghuangLoader = FenghuangLoader.instance;
        fenghuangLoader.loadFromFile(path.resolve(__dirname, "./test.json"));
        expect(fenghuangLoader.services.serviceA).to.equal(require("./ServiceA"));
        expect(fenghuangLoader.services.serviceB).to.equal(require("./ServiceB"));
        expect(fenghuangLoader.services.serviceC).to.equal(require("./ServiceC"));
    });
});