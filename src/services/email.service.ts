import { Resend } from "resend";
import { ILead } from "../models/lead.model";

let _resend: Resend | null = null;

function getResend(): Resend {
    if (!_resend) {
        _resend = new Resend(process.env.RESEND_API_KEY);
    }
    return _resend;
}

function getFrom(): string {
    return (
        process.env.RESEND_FROM_EMAIL ??
        "Devanthos <noreply@system.devanthos.com>"
    );
}

/**
 * Formatea un precio en CLP
 */
function formatPrice(amount: number): string {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Email de confirmación que se envía al cliente cuando se genera su presupuesto
 */
export async function sendBudgetConfirmationEmail(
    lead: ILead,
    pdfBuffer: Buffer,
    budgetNumber: string,
): Promise<void> {
    const additionalFeaturesList =
        lead.additionalFeatures.length > 0
            ? lead.additionalFeatures
                  .map((f) => `<li>${f.name} — ${formatPrice(f.price)}</li>`)
                  .join("")
            : "<li>Ninguna</li>";

    const timelineLabel: Record<string, string> = {
        urgent: "Urgente",
        normal: "Normal",
        extended: "Extendido",
    };

    const { error } = await getResend().emails.send(
        {
            from: getFrom(),
            to: [lead.clientEmail],
            subject: `Tu presupuesto Devanthos #${budgetNumber} está listo`,
            attachments: [
                {
                    filename: `Presupuesto-${budgetNumber}.pdf`,
                    content: pdfBuffer,
                },
            ],
            html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="font-family:Arial,sans-serif;color:#1a1a2e;background:#f9f9f9;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <div style="background:#1a1a2e;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;">Devanthos</h1>
      <p style="color:#a0a0c8;margin:8px 0 0;">Tu presupuesto está listo</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="font-size:16px;">Hola <strong>${lead.clientName}</strong>,</p>
      <p>Gracias por tu interés. Adjunto encontrarás tu presupuesto personalizado.</p>

      <div style="background:#f4f4fb;border-radius:8px;padding:20px;margin:24px 0;">
        <h2 style="font-size:16px;margin:0 0 16px;color:#1a1a2e;">Resumen del presupuesto #${budgetNumber}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 0;color:#666;">Tipo de proyecto</td><td style="text-align:right;font-weight:600;">${lead.pageTypeName}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Precio base</td><td style="text-align:right;">${formatPrice(lead.basePrice)}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Plazo de entrega</td><td style="text-align:right;">${lead.estimatedDays} días (${timelineLabel[lead.timeline] ?? lead.timeline})</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Fecha estimada</td><td style="text-align:right;">${lead.deliveryDate}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #e0e0f0;margin:16px 0;">
        <p style="font-size:13px;color:#666;margin:0 0 6px;">Características adicionales:</p>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#444;">${additionalFeaturesList}</ul>
        <hr style="border:none;border-top:1px solid #e0e0f0;margin:16px 0;">
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:16px;font-weight:700;">Total</span>
          <span style="font-size:18px;font-weight:700;color:#6c63ff;">${formatPrice(lead.totalPrice)}</span>
        </div>
      </div>

      <p style="font-size:14px;color:#555;">¿Tienes alguna pregunta? Responde este correo y te atenderemos a la brevedad.</p>
      <p style="font-size:14px;color:#555;margin-top:24px;">— El equipo de <strong>Devanthos</strong></p>
    </div>
    <div style="background:#f4f4fb;padding:16px 40px;text-align:center;font-size:12px;color:#999;">
      Este correo es una confirmación automática. Presupuesto válido por 30 días.
    </div>
  </div>
</body>
</html>`,
        },
        { idempotencyKey: `budget-confirmation/${budgetNumber}` },
    );

    if (error) {
        throw new Error(`Resend error (confirmación): ${error.message}`);
    }
}

/**
 * Email de seguimiento que se envía a leads cada 15 días
 */
export async function sendFollowUpEmail(lead: ILead): Promise<void> {
    const fromEmail = getFrom();
    const { error } = await getResend().emails.send(
        {
            from: fromEmail,
            to: [lead.clientEmail],
            subject: `${lead.clientName}, ¿seguimos con tu proyecto web?`,
            html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="font-family:Arial,sans-serif;color:#1a1a2e;background:#f9f9f9;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <div style="background:#1a1a2e;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;">Devanthos</h1>
      <p style="color:#a0a0c8;margin:8px 0 0;">Seguimiento de tu presupuesto</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="font-size:16px;">Hola <strong>${lead.clientName}</strong>,</p>
      <p>Hace unos días te enviamos un presupuesto para tu proyecto de <strong>${lead.pageTypeName}</strong> por un total de <strong>${formatPrice(lead.totalPrice)}</strong>.</p>
      <p>Queremos saber si tienes alguna duda o si podemos ayudarte a dar el próximo paso.</p>

      <div style="text-align:center;margin:32px 0;">
        <a href="mailto:${fromEmail.match(/[\w.-]+@[\w.-]+/)?.[0] ?? ""}"
           style="background:#6c63ff;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
          Quiero avanzar con mi proyecto
        </a>
      </div>

      <p style="font-size:14px;color:#555;">Recuerda que tu presupuesto <strong>#${lead.budgetNumber}</strong> tiene una validez de 30 días desde su emisión.</p>
      <p style="font-size:14px;color:#555;margin-top:24px;">— El equipo de <strong>Devanthos</strong></p>
    </div>
    <div style="background:#f4f4fb;padding:16px 40px;text-align:center;font-size:12px;color:#999;">
      Recibes este correo porque solicitaste un presupuesto en Devanthos.
    </div>
  </div>
</body>
</html>`,
        },
        { idempotencyKey: `follow-up/${lead.budgetNumber}/${Date.now()}` },
    );

    if (error) {
        throw new Error(
            `Resend error (follow-up ${lead.budgetNumber}): ${error.message}`,
        );
    }
}
