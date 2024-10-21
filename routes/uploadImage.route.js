const express = require("express");
const fs = require("fs");
const {uploadProfileImage} = require("../controller/user.controller");
const path = require("path");
const uploadRouter = express.Router();
const multer = require("multer");
// const isAuth = require('../middleware/jwt_auth');
const isAuth = require("../middleware/jwt_auth");
const clog = require("../services/ChalkService");
let UploadPath = "public/upload";
let FileSizeLimit = 10; // IN Mb
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(UploadPath)) {
      fs.mkdir(UploadPath);
    }
    cb(null, UploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const filenameWithTimestamp = `${timestamp}_${file.originalname}`;
    cb(null, filenameWithTimestamp);
  },
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    clog.success("File Type: ", file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      clog.error('File type not supported. Only images are allowed.');
      cb(new Error('File type not supported. Only images are allowed.'));
    }
  }
});
const fileSizeValidator = (req, res, next) => {
  let fileSize = req.headers['content-length'] / 1024 / 1024;
  fileSize = Math.round(fileSize);
  if (fileSize >= FileSizeLimit) {
    clog.error('File Size Exceed !!');
    return res.json({status: 0, message: req.__('File Size Exceed 10 mb')});
  } else {
    next();
  }
}
uploadRouter.put("/image", isAuth, fileSizeValidator, upload.single("file"), uploadProfileImage);

module.exports = uploadRouter;
