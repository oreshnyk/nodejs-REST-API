const express = require("express");
const { schemas } = require("../../models/user");
// const { User } = require("../../models/user");
const { validateBody, authenticate, upload } = require("../../middlewars");
const ctrl = require("../../controllers/users");
const router = express.Router();

router.post("/register", upload.single('avatar'), validateBody(schemas.registerSchema), ctrl.register);
router.get("/verify/:verificationToken", ctrl.verifyEmail);
router.post("/verify", validateBody(schemas.emailSchema), ctrl.resendVerificationEmail)
router.post("/login", validateBody(schemas.loginSchema), ctrl.login);
router.get("/current", authenticate, ctrl.getCurrentUser);
router.post("/logout", authenticate, ctrl.logout);
router.patch("/avatars", authenticate, upload.single("avatar"), ctrl.updateAvatar);

module.exports = router;