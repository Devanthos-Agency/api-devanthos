import { Router, IRouter } from "express";
import { generateBudgetPdf } from "../controllers/budget.controller";

const router: IRouter = Router();

/**
 * @route   POST /api/budget/generate
 * @desc    Genera un PDF del presupuesto y lo descarga directamente
 * @access  Public
 */
router.post("/generate", generateBudgetPdf);

export default router;
