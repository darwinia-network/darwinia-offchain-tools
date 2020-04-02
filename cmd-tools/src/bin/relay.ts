import RelayService from "../services/relay";

(async () => {
    const service = new RelayService();
    await service.start();
})();
