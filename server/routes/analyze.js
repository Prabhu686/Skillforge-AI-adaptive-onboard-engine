const express  = require("express");
const multer   = require("multer");
const { analyze, compare, build, buildDownload, quiz, quizEvaluate, interviewQuestions, interviewEvaluate, interviewSave } = require("../controllers/analyzeController");

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
router.post("/quiz", quiz);
router.post("/quiz/evaluate", quizEvaluate);
router.post("/interview/questions", interviewQuestions);
router.post("/interview/evaluate", interviewEvaluate);
router.post("/interview/save", interviewSave);

module.exports = router;
