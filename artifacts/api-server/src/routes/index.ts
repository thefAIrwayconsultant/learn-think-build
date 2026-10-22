import { Router, type IRouter } from "express";
import healthRouter from "./health";
import familyRouter from "./family";
import billingRouter from "./billing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(familyRouter);
router.use(billingRouter);

export default router;
