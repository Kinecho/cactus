//tslint:disable:no-console

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
        return `${this.getDateString()} [${this.serverName ? `${this.serverName}.` : ""}${this.fileName}]`
    }

    debug(...args: [any?, ...any[]]) {
        const a: any = [].slice.call(arguments, 0);
        a.unshift(this.prefix);
        console.debug.apply(console, a);
    }

    log(...args: [any?, ...any[]]) {
        this.info(...args);
    }

    info(...args: [any?, ...any[]]) {
        const a: any = [].slice.call(arguments, 0);
        a.unshift(this.prefix);
        console.log.apply(console, a);
    }

    warn(...args: [any?, ...any[]]) {
        const a: any = [].slice.call(arguments, 0);
        a.unshift(this.prefix);
        console.warn.apply(console, a);
    }

    error(...args: [any?, ...any[]]) {
        const a: any = [].slice.call(arguments, 0);
        a.unshift(this.prefix);
        console.error.apply(console, a);
    }

    getDateString(): string {
        return (new Date()).toISOString()
    }
}