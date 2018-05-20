const FenghuangService = require("../../../lib/FenghuangService");

class ServiceB extends FenghuangService {
    static get dependencies() {
        return [
            "ServiceC"
        ];
    }
}

module.exports = ServiceB;

ServiceB._register();