import { Router } from "express";
import { registerUser } from "../src/controllers/user.controllers.js";

const router=Router()

router.route("/register").post(registerUser)

export default router;