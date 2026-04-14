import cron from "node-cron";
import { LeadService } from "../services/lead.service";
import { sendFollowUpEmail } from "../services/email.service";

/**
 * Job que se ejecuta cada 15 días a las 9:00 AM.
 * Busca leads que no han recibido seguimiento reciente y les envía un email.
 *
 * Expresión cron: "0 9 1,16 * *"
 *   → Día 1 y día 16 de cada mes, a las 09:00 hs.
 *   Esto garantiza intervalos de ~15 días de forma predecible.
 */
export function startFollowUpJob(): void {
    cron.schedule(
        "0 9 1,16 * *",
        async () => {
            console.log("[FollowUp Job] Iniciando envío de follow-ups...");

            let enviados = 0;
            let errores = 0;

            try {
                const leads = await LeadService.getLeadsForFollowUp();
                console.log(
                    `[FollowUp Job] Leads a contactar: ${leads.length}`,
                );

                for (const lead of leads) {
                    try {
                        await sendFollowUpEmail(lead);
                        await LeadService.markFollowUpSent(
                            (lead._id as string).toString(),
                        );
                        enviados++;
                    } catch (err) {
                        errores++;
                        console.error(
                            `[FollowUp Job] Error enviando a ${lead.clientEmail}:`,
                            err,
                        );
                    }
                }
            } catch (err) {
                console.error("[FollowUp Job] Error al obtener leads:", err);
            }

            console.log(
                `[FollowUp Job] Completado — enviados: ${enviados}, errores: ${errores}`,
            );
        },
        { timezone: "America/Santiago" },
    );

    console.log(
        "✅ Job de follow-up registrado (días 1 y 16 de cada mes, 09:00 Santiago)",
    );
}
