import express from "express";
import {
  addFood,
  listFood,
  removeFood,
  toggleSurplus,
  createBulkItem
} from "../controllers/foodController.js";
import multer from "multer";
const foodRouter = express.Router();

//Image Storage Engine (Saving Image to uploads folder & rename it)

// const storage = multer.diskStorage({
//     destination: 'uploads',
//     filename: (req, file, cb) => {
//         return cb(null,`${Date.now()}${file.originalname}`);
//     }
// })

// const upload = multer({ storage: storage})
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

foodRouter.get("/list", listFood);
foodRouter.post(
  "/add",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "model3D", maxCount: 1 },
  ]),
  addFood
);
foodRouter.post("/remove", removeFood);

// --- NEW ROUTE ADDED HERE ---
// foodRouter.post("/surplus", toggleSurplus);
foodRouter.post("/create-bulk", createBulkItem);

export default foodRouter;
