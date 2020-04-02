import RelayService from "../services/relay";

(async function() {
    const service = new RelayService();
    await service.start();
})();
