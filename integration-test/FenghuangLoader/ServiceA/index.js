const FenghuangService = require("../../../lib/FenghuangService");

class ServiceA extends FenghuangService {
    static get dependencies() {
        return [
            "ServiceB"
        ];
    }
}

ServiceA._register();

module.exports = ServiceA;