import API from "../../src/ethereum/API";

export async function bootstrap(): Promise<void> {
    const api = new API();
    await api.setPolkadotJs();
}
