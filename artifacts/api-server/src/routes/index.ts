import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quotesRouter from "./quotes";
import detailRouter from "./detail";
import historyRouter from "./history";
import analysisRouter from "./analysis";
import newsRouter from "./news";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quotesRouter);
router.use(detailRouter);
router.use(historyRouter);
router.use(analysisRouter);
router.use(newsRouter);

export default router;
