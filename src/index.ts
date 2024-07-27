import express from "express";
import fs from "fs/promises";

const app = express();

app.listen(process.env.PORT || 5050, () => {
  console.log(`Server is running on port ${process.env.PORT || 5050}`);
});
