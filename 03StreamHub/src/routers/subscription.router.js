import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getUserChannelSubscriberList, toggleSubscribe, getSubscribedChannels } from "../controllers/subscription.controller.js";

const router = Router();

router.route("/toggle-subscribe/@:userName").post(verifyJWT, toggleSubscribe); //works just fine😁
router.route("/subscribers/@:userName").post(getUserChannelSubscriberList); //works just fine😁
router.route("/subscribed-to").get(verifyJWT, getSubscribedChannels); //works just fine😁

export default router;