/**
 *
 * abstract service class
 *
 */
import { IConfig } from "../types";

abstract class Service {
    protected abstract config: IConfig;

    public abstract async start(): Promise<void>;
    public abstract async stop(): Promise<void>;
}

export default Service;
