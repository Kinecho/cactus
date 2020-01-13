import chalk from "chalk";

export default class Logger {
    fileName: string;
    serverName?: string;

    constructor(options: string | { fileName: string, serverName?: string }) {
        if (typeof options === "string") {
            this.fileName = options;
            this.serverName = process.env.FUNCTION_NAME || undefined;
        } else {
            this.fileName = options.fileName;
            this.serverName = options.serverName;
        }
    }

    protected get prefix(): string {
        return `[${this.serverName ? `${this.serverName}.` : ""}${this.fileName}] ${this.getDateString()} |`
    }

    debug(...args: any[]) {
        console.debug.apply(this, [chalk.blue(this.prefix), ...args]);
    }

    log(...args: any[]) {
        this.info(...args);
    }

    info(...args: any[]) {
        console.log.apply(this, [this.prefix, ...args]);
    }

    warn(...args: any[]) {
        console.warn.apply(this, [chalk.yellow(this.prefix), ...args]);
    }

    error(...args: any[]) {
        console.error.apply(this, [chalk.red(this.prefix), ...args]);
    }

    getDateString(): string {
        return (new Date()).toISOString()
    }
}