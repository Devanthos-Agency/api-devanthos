/**
 * Configuración centralizada de la aplicación
 */

interface Config {
    port: number;
    nodeEnv: string;
    mongodbUri: string;
    resend: {
        apiKey: string;
        fromEmail: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
}

const config: Config = {
    port: parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    mongodbUri: process.env.MONGODB_URI || "",
    resend: {
        apiKey: process.env.RESEND_API_KEY || "",
        fromEmail:
            process.env.RESEND_FROM_EMAIL ||
            "Devanthos <noreply@system.devanthos.com>",
    },
    jwt: {
        secret: process.env.JWT_SECRET || "",
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    },
};

export default config;
