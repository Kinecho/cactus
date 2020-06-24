import * as express from "express";

const router = express.Router();

// Sample route for proving out how the routing would work on an appengine project
router.get("/hello", (req, resp) => {
    const name = req.query.name ?? "there";
    resp.send(`Hello ${ name }!`);
});

export default router;
