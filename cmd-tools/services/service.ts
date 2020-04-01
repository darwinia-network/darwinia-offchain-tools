/**
 *
 * abstract service class
 *
 */
abstract class Service {
    abstract async start(): Promise<void>;
    abstract async stop(): Promise<void>;
}

export default Service;
