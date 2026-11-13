import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { me, recordSession } from "./auth.controller.js";

export const authRouter = Router();
authRouter.get("/me", asyncHandler(me));
authRouter.post("/session", asyncHandler(recordSession));

