//tslint:disable:no-console

export interface LoggerAgent {
    debug(message?: any, ...optionalParams: any[]): void;
    info(message?: any, ...optionalParams: any[]): void;
    log(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
    error(message?: any, ...optionalParams: any[]): void;
}

export default class Logger {
    fileName: string;
    serverName?: string;

    static agent:LoggerAgent = console;

    static setAgent(agent: LoggerAgent) {
        Logger.agent = agent;
    }

    constructor(options: string | { fileName: string, serverName?: string }) {
        if (typeof options === "string") {
            this.fileName = options;
            this.serverName = process.env.FUNCTION_NAME || process.env.K_SERVICE || undefined;
        } else {
            this.fileName = options.fileName;
            this.serverName = options.serverName;
        }
    }

    protected get prefix(): string {
        return `${ this.getDateString() } [${ this.serverName ? `${ this.serverName }.` : "" }${ this.fileName }]`
    }

    debug(...args: [any?, ...any[]]) {
        const a: any = [].slice.call(arguments, 0);
        a.unshift(this.prefix);
        Logger.agent.debug.apply(Logger.agent, a);
    }

    log(...args: [any?, ...any[]]) {
        this.info(...args);
    }

    info(...args: [any?, ...any[]]) {
        const a: any = [].slice.call(arguments, 0);
        a.unshift(this.prefix);
        Logger.agent.log.apply(Logger.agent, a);
    }

    warn(...args: [any?, ...any[]]) {
        const a: any = [].slice.call(arguments, 0);
        a.unshift(this.prefix);
        Logger.agent.warn.apply(Logger.agent, a);
    }

    error(...args: [any?, ...any[]]) {
        const a: any = [].slice.call(arguments, 0);
        a.unshift(this.prefix);
        Logger.agent.error.apply(Logger.agent, a);
    }

    getDateString(): string {
        return (new Date()).toISOString()
    }
}