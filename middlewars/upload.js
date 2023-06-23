const multer = require("multer");
const path = require("path");

const tempDir = path.join(__dirname, "../", "temp");

const multerConfig = multer.diskStorage({
  destination: tempDir,
  filename: (req, file, cb) => {
    const uniquePreffix = Date.now() + "_" + Math.round(Math.random() * 1E9);
    const {originalname} = file;
    const filename = `${uniquePreffix}_${originalname}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: multerConfig,
});

module.exports = upload;