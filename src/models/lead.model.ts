import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Documento de Lead (cliente potencial) en MongoDB
 */
export interface ILead extends Document {
    // Datos del cliente
    clientName: string;
    clientEmail: string;
    clientCompany?: string;
    clientDescription?: string;

    // Datos del presupuesto generado
    budgetNumber: string;
    pageTypeName: string;
    pageTypeId: string;
    basePrice: number;
    totalPrice: number;
    timeline: "urgent" | "normal" | "extended";
    estimatedDays: number;
    deliveryDate: string;
    additionalFeatures: {
        id: string;
        name: string;
        price: number;
    }[];

    // Metadata
    generatedAt: Date;
    lastFollowUpSentAt?: Date;
    followUpCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
    {
        // Datos del cliente
        clientName: {
            type: String,
            required: [true, "El nombre del cliente es requerido"],
            trim: true,
        },
        clientEmail: {
            type: String,
            required: [true, "El email del cliente es requerido"],
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Formato de email inválido"],
        },
        clientCompany: {
            type: String,
            trim: true,
        },
        clientDescription: {
            type: String,
            trim: true,
        },

        // Datos del presupuesto
        budgetNumber: {
            type: String,
            required: true,
            unique: true,
        },
        pageTypeName: {
            type: String,
            required: true,
        },
        pageTypeId: {
            type: String,
            required: true,
        },
        basePrice: {
            type: Number,
            required: true,
            min: 0,
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        timeline: {
            type: String,
            enum: ["urgent", "normal", "extended"],
            required: true,
        },
        estimatedDays: {
            type: Number,
            required: true,
            min: 1,
        },
        deliveryDate: {
            type: String,
            required: true,
        },
        additionalFeatures: [
            {
                id: { type: String, required: true },
                name: { type: String, required: true },
                price: { type: Number, required: true, min: 0 },
            },
        ],

        // Metadata
        generatedAt: {
            type: Date,
            default: Date.now,
        },
        lastFollowUpSentAt: {
            type: Date,
        },
        followUpCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

// Índices para búsquedas frecuentes
leadSchema.index({ clientEmail: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ totalPrice: -1 });
leadSchema.index({ pageTypeId: 1 });

export const Lead: Model<ILead> = mongoose.model<ILead>("Lead", leadSchema);
