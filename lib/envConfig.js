const DotObject = require("dot-object");

const dot = new DotObject("_");

const ENV_NAMESPACE = "FENGHUANG_";

function parseEnvConfig() {
    return dot.object(Object.keys(process.env)
        .filter(envKey => envKey.startsWith(ENV_NAMESPACE))
        .reduce((acc, envKey) => {
            acc[envKey.slice(ENV_NAMESPACE.length)] = JSON.parse(process.env[envKey]);
            return acc;
        }, {}));
}

const envConfig = parseEnvConfig();

module.exports = {
    envConfig: envConfig,
    parseEnvConfig: parseEnvConfig
};