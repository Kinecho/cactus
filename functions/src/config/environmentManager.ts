
export enum Environment {
    test,
    production,
    development,
    unknown,
}

let _environment = Environment.unknown;

export function getEnvironment():Environment {
    if (_environment === Environment.unknown){
        _environment = getEnvironmentFromProcess();
    }

    return _environment
}

function getEnvironmentFromProcess():Environment {
    const nodeEnv = process.env.NODE_ENV;
    let foundEnv:Environment;
    switch (nodeEnv) {
        case "production":
            foundEnv = Environment.production;
            break;
        case "development":
            foundEnv= Environment.development;
            break;
        case "tet":
            foundEnv = Environment.test;
            break;
        default:
            foundEnv = Environment.unknown;
        break;
    }
    return foundEnv;
}

/**
 * Set the current runtime environment. Used for testing
 * @param {Environment} environment - required
 */
export function setEnvironment(environment:Environment) {
    _environment = environment
}