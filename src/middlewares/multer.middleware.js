import multer from "multer";

//middleware function to store file data in storage temporarily.
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp/uploads");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.originalname + "-" + uniqueSuffix);
    },
});

export const upload = multer({ storage });
