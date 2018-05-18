const chai = require("chai");
const expect = chai.expect;
process.env.NODE_ENV = "test";

describe("FenghuangService", function() {
    let FenghuangService;

    beforeEach(function() {
        FenghuangService = require("../lib/FenghuangService");
    });

    afterEach(function() {
        delete require.cache[require.resolve("../lib/FenghuangService")];
    });

    it("Should resolve the dependency tree", function() {
        class Beer extends FenghuangService {
            static get dependencies() {
                return [
                    "Water",
                    "Malt"
                ];
            }
        }

        Beer._register();

        class Malt extends FenghuangService {
            static get dependencies() {
                return [
                    "Water",
                    "Air"
                ];
            }
        }

        Malt._register();

        class Water extends FenghuangService {
        }

        Water._register();

        class Air extends FenghuangService {

        }

        Air._register();

        expect(Beer.instance).to.be.an.instanceOf(Beer);
    });

    it("Should inject dependencies as underscored properties", function() {
        class Beer extends FenghuangService {
            static get dependencies() {
                return [
                    "Water",
                    "Malt"
                ];
            }
        }

        Beer._register();

        class Malt extends FenghuangService {
            static get dependencies() {
                return [
                    "Water",
                    "HotAir"
                ];
            }
        }

        Malt._register();

        class Water extends FenghuangService {
        }

        Water._register();

        class HotAir extends FenghuangService {

        }

        HotAir._register();

        const beer = Beer.instance;
        expect(beer._water).to.be.an.instanceOf(Water);
        expect(beer._malt).to.be.an.instanceOf(Malt);
        expect(beer._malt._water).to.be.an.instanceOf(Water);
        expect(beer._malt._hotAir).to.be.an.instanceOf(HotAir);
    });
});