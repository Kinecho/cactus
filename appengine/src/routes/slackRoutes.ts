import * as express from "express";

const router = express.Router();

router.get("/hello", (req, resp) => {
    const name = req.query.name ?? "there";
    resp.send(`Hello ${ name }!`);
});

export default router;
