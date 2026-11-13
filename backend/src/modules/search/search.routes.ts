import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { globalSearch } from "./search.controller.js";

export const searchRouter = Router();
searchRouter.get("/", asyncHandler(globalSearch));

