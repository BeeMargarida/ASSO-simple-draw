const express = require("express");
const router = express.Router();
const { saveFile, loadFile } = require('../controllers/files');

router.post("/load", loadFile);
router.post("/save", saveFile);

module.exports = router;