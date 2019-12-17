import { Request, Response } from "express";
import Starter from "../ethereum/Starter";
import { fork, ChildProcess } from "child_process";
import { join } from "path";
import ProofSubmit from "../ethereum/Proof";
import logger from "../util/logger";

const ethereumProofStarter = new Starter();
ethereumProofStarter.startAPI();

const proofSubmit = new ProofSubmit();

let forkStarter: ChildProcess;
/**
 * GET /
 * Home page.
 */
export const index = (req: Request, res: Response) => {
    res.render("home", {
        title: "Home"
    });
};

export const startRelay = async (req: Request, res: Response) => {
    if(forkStarter && !forkStarter.killed) { 
        forkStarter.kill();
    }
    
    forkStarter = fork(join(__dirname, "../ethereum/ForkStarter.js"));

    res.json({
        error: 0
    });
};

export const stopRelay = async (req: Request, res: Response) => {

    forkStarter.kill();

    res.json({
        error: 0
    });
};

export const getRelay = async (req: Request, res: Response) => {

    let alive = false;
    if(forkStarter && !forkStarter.killed) {
        alive = true;
    }

    res.json({
        error: 0,
        data: alive
    });
};

export const checkReceipt = async (req: Request, res: Response) => {
    logger.info(req.body);
    const status = await proofSubmit.checkReceipt(req.body.index, req.body.proof, req.body.header_hash).catch((e) => {
        res.json({
            error: 1,
            data: e.toString()
        });
    });
    console.log(status);
    res.json({
        error: 0,
        data: status
    });
};

