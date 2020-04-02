/**
 *
 * abstract service class
 *
 */
abstract class Service {
    public abstract async start(): Promise<void>;
    public abstract async stop(): Promise<void>;
}

export default Service;
