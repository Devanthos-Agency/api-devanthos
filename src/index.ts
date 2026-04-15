import dotenv from "dotenv";
import http from "http";
import app from "./app";
import { connectMongoDB } from "./config/database";
import { startFollowUpJob } from "./jobs/followUp.job";
import mongoose from "mongoose";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function bootstrap() {
    try {
        await connectMongoDB();
    } catch (err) {
        console.error(
            "⚠️  No se pudo conectar a MongoDB tras varios intentos:",
            (err as Error).message,
        );
        console.error(
            "   Verifica MONGODB_URI y la whitelist de IPs en Atlas.",
        );
        process.exit(1);
    }

    const server = http.createServer(app);

    server.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📍 Entorno: ${process.env.NODE_ENV || "development"}`);
        startFollowUpJob();
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        console.log(`\n${signal} recibido — cerrando servidor...`);
        server.close(async () => {
            await mongoose.connection.close();
            console.log("👋 Servidor cerrado correctamente");
            process.exit(0);
        });

        // Forzar cierre si no termina en 10s
        setTimeout(() => {
            console.error("⏰ Cierre forzado tras timeout");
            process.exit(1);
        }, 10_000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap();
