import { Router, type IRouter } from "express";
import healthRouter from "./health";
import familyRouter from "./family";
import discountCodesRouter from "./discount-codes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(familyRouter);
router.use(discountCodesRouter);

export default router;
