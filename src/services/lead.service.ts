import { Lead, ILead } from "../models/lead.model";
import { BudgetRequest } from "../models/budget.model";

/**
 * Servicio para gestionar leads (clientes potenciales) en MongoDB
 */
export class LeadService {
    /**
     * Guarda un lead a partir de los datos del presupuesto generado
     */
    static async saveLead(
        budgetData: BudgetRequest,
        budgetNumber: string,
    ): Promise<ILead> {
        const leadData = {
            clientName: budgetData.clientInfo.name,
            clientEmail: budgetData.clientInfo.email,
            clientCompany: budgetData.clientInfo.company,
            clientDescription: budgetData.clientInfo.description,
            budgetNumber,
            pageTypeName: budgetData.pageType.name,
            pageTypeId: budgetData.pageType.id,
            basePrice: budgetData.pageType.basePrice,
            totalPrice: budgetData.totalPrice,
            timeline: budgetData.timeline,
            estimatedDays: budgetData.estimatedDays,
            deliveryDate: budgetData.deliveryDate,
            additionalFeatures: budgetData.additionalFeatures.map((f) => ({
                id: f.id,
                name: f.name,
                price: f.price,
            })),
            generatedAt: budgetData.generatedAt
                ? new Date(budgetData.generatedAt)
                : new Date(),
        };

        const lead = await Lead.create(leadData);
        return lead;
    }

    /**
     * Obtiene todos los leads ordenados por fecha de creación descendente
     */
    static async getAllLeads(): Promise<ILead[]> {
        return Lead.find().sort({ createdAt: -1 }).lean();
    }

    /**
     * Obtiene un lead por su número de presupuesto
     */
    static async getLeadByBudgetNumber(
        budgetNumber: string,
    ): Promise<ILead | null> {
        return Lead.findOne({ budgetNumber }).lean();
    }

    /**
     * Busca leads por email del cliente
     */
    static async getLeadsByEmail(email: string): Promise<ILead[]> {
        return Lead.find({ clientEmail: email.toLowerCase() })
            .sort({ createdAt: -1 })
            .lean();
    }

    /**
     * Obtiene leads que necesitan follow-up:
     * - nunca recibieron un follow-up, Y han pasado 15 días desde que se crearon, O
     * - ya recibieron un follow-up hace al menos 15 días.
     * Solo leads con menos de 3 follow-ups (evita spam).
     */
    static async getLeadsForFollowUp(): Promise<ILead[]> {
        const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

        return Lead.find({
            followUpCount: { $lt: 3 },
            $or: [
                {
                    lastFollowUpSentAt: { $exists: false },
                    createdAt: { $lte: fifteenDaysAgo },
                },
                {
                    lastFollowUpSentAt: { $lte: fifteenDaysAgo },
                },
            ],
        }).lean();
    }

    /**
     * Registra que se envió un follow-up al lead
     */
    static async markFollowUpSent(leadId: string): Promise<void> {
        await Lead.updateOne(
            { _id: leadId },
            {
                $set: { lastFollowUpSentAt: new Date() },
                $inc: { followUpCount: 1 },
            },
        );
    }
}
