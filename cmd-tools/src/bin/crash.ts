import config from "../../cfg";
import Crash from "../services/crash";

(() => {
    let crash = new Crash(config);
    crash.start();
})();
