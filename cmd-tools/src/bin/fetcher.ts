import config from "../../cfg";
import FetcherService from "../services/fetcher";

(() => {
    const service = new FetcherService(config);
    service.start();
})();
