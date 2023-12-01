const express = require("express");

const ctrl = require("../../controllers/auth");

const { validateBody, authenticate, upload } = require("../../middlewares");

const { schemas } = require("../../utils/validation/userValidationSchemas");

const router = express.Router();

// signup
router.post("/register", validateBody(schemas.registerSchema), ctrl.register);

router.get("/verify/:verificationToken", ctrl.verify);

router.post("/verify", ctrl.resendVerifyEmail);

// signin
router.post("/login", validateBody(schemas.loginSchema), ctrl.login);

router.get("/current", authenticate, ctrl.getCurrent);

router.post("/logout", authenticate, ctrl.logout);

router.patch(
  "/users",
  authenticate,
  validateBody(schemas.subscriptionSchema),
  ctrl.updateSubscription
);

router.patch(
  "/avatar",
  authenticate,
  upload.single("avatar"),
  ctrl.uploadAvatar
);

module.exports = router;
