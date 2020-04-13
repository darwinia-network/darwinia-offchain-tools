import fs from "fs";
import { resolve } from "bluebird";

export function setDelay(t: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, t);
    });
}

export function storageToFile(filename: string, str: string, callback?: () => void) {
    return new Promise((resolve) => {
        fs.writeFile(filename, str, function (err) {
            if (err) {
                return console.error(err);
            }
            callback && callback();
            resolve();
        });
    });
}

export function readFromFile(filename: string){
    return fs.readFileSync(filename).toString();
}