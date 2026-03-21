const express  = require("express");
const multer   = require("multer");
const { analyze, compare, build, buildDownload } = require("../controllers/analyzeController");

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/",
  upload.fields([{ name: "resume", maxCount: 1 }, { name: "jd", maxCount: 1 }]),
  analyze
);

router.post("/compare",
  upload.fields([{ name: "resume1", maxCount: 1 }, { name: "resume2", maxCount: 1 }, { name: "jd", maxCount: 1 }]),
  compare
);

router.post("/build", build);
router.post("/build/download", buildDownload);

module.exports = router;
