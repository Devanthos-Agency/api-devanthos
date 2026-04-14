import { Request, Response, RequestHandler } from "express";
import { BudgetRequest } from "../models/budget.model";
import { BudgetPdfService } from "../services/budgetPdf.service";
import { LeadService } from "../services/lead.service";
import { sendBudgetConfirmationEmail } from "../services/email.service";
import asyncHandler from "../utils/asyncHandler";
import { ValidationError } from "../utils/errors";

/**
 * Controlador para generar y descargar PDF de presupuesto
 */
export const generateBudgetPdf: RequestHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const budgetData: BudgetRequest = req.body;

        // Validaciones — lanzan errores que el error handler captura automáticamente
        if (!budgetData.clientInfo || !budgetData.pageType) {
            throw new ValidationError(
                "Faltan datos requeridos: clientInfo y pageType son obligatorios",
            );
        }

        if (!budgetData.clientInfo.name || !budgetData.clientInfo.email) {
            throw new ValidationError(
                "Faltan datos del cliente: name y email son obligatorios",
            );
        }

        if (!budgetData.pageType.name || !budgetData.pageType.basePrice) {
            throw new ValidationError(
                "Faltan datos del tipo de página: name y basePrice son obligatorios",
            );
        }

        // Generar PDF
        const { pdfBuffer, budgetNumber } =
            await BudgetPdfService.generatePdf(budgetData);

        // Guardar lead y enviar email de confirmación (no bloqueante)
        LeadService.saveLead(budgetData, budgetNumber)
            .then((lead) =>
                sendBudgetConfirmationEmail(lead, pdfBuffer, budgetNumber),
            )
            .catch((err) => {
                console.error("Error al guardar lead o enviar email:", err);
            });

        // Configurar headers para descarga
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Presupuesto-${budgetNumber}.pdf"`,
        );
        res.setHeader("Content-Length", pdfBuffer.length);

        // Enviar PDF directamente
        res.send(pdfBuffer);
    },
);
