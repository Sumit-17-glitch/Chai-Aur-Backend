import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);  //works just fine😁
router.route("/login").post(loginUser); //works just fine😁 
router.route("/logout").post(verifyJWT, logoutUser); //works just fine😁
router.route("/refresh-access-token").post(refreshAccessToken); //works just fine😁
router.route("/change-password").post(verifyJWT, changeCurrentPassword); //works just fine😁
router.route("/current-user").get(verifyJWT, getCurrentUser); //works just fine😁
router.route("/update-details").patch(verifyJWT, updateAccountDetails); //works just fine😁
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar); //works just fine😁
router
  .route("/update-cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage); //works just fine😁
router
  .route("/get-user-channel/:userName") //works just fine😁
  .get(verifyJWT, getUserChannelProfile); 
router.route("/get-user-watch-history").get(verifyJWT, getUserWatchHistory); //works just fine😁

export default router;
