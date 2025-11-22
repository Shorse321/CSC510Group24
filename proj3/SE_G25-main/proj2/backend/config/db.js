import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect(
      "mongodb+srv://swetha2m3_db_user:seproj3@cluster0.ryygmbz.mongodb.net/"
    )
    .then(() => console.log("DB Connected"));
};
