/* eslint-disable */
const chalk = require("chalk");

export enum Logger {
    Error,
    Info,
    Success,
}

export function log(s: string, logger?: Logger): void {
    const l = chalk.dim("[");
    const r = chalk.dim("]:");

    switch (logger) {
        case Logger.Error:
            console.error(`${l} ${chalk.red("error")} ${r} ${s}`);
            process.exit(1);
        case Logger.Success:
            console.log(`${l} ${chalk.green("success")} ${r} ${s}`);
            break;
        default:
            console.log(`${l} ${chalk.cyan("info")} ${r} ${s}`);
            break;
    }
}
