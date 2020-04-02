import config from "../../cfg";
import RelayService from "../services/relay";

(async () => {
    const service = new RelayService(config);
    await service.start();
})();
