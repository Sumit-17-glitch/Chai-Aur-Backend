import { Router } from "express";
import { deleteVideo, getVideoById, publishVideo, togglePublishStatus, getAllVideos } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/publish-video").post(
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  publishVideo,
); //works just fine😁
router.route("/get-video/:videoId").get(getVideoById); //works just fine😁
router.route("/delete-video/:videoId").delete( verifyJWT ,deleteVideo); //works just fine😁
router.route("/toggle-published/:videoId").get(verifyJWT, togglePublishStatus) //works just fine😁
router.route("/get-all-videos").get(getAllVideos); //works just fine😁

export default router;
