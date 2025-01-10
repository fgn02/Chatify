const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");
const authenticate = require("../middleware/authenticate");

router.get("/dashboard", authenticate, groupController.getGroupDashboard);
router.post("/create", authenticate, groupController.createGroup);
router.get("/:groupId/members", authenticate, groupController.getGroupMembers);
router.get(
  "/:groupId/messages",
  authenticate,
  groupController.getGroupMessages
);

module.exports = router;
