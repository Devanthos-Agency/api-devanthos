import mongoose from "mongoose";
import dns from "dns";

// Forzar DNS públicos de Google para resolver registros SRV de Atlas
// en redes con firewalls o DNS que no soporten SRV
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

export async function connectMongoDB(
    retries = 5,
    delayMs = 3000,
): Promise<void> {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error("La variable de entorno MONGODB_URI no está definida");
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(MONGODB_URI, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
            });
            return;
        } catch (err) {
            const isLast = attempt === retries;
            console.error(
                `❌ MongoDB intento ${attempt}/${retries} fallido:`,
                (err as Error).message,
            );
            if (isLast) throw err;
            await new Promise((r) => setTimeout(r, delayMs * attempt));
        }
    }
}

mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB conectado");
});

mongoose.connection.on("error", (err) => {
    console.error("❌ Error de MongoDB:", err);
});

mongoose.connection.on("disconnected", () => {
    console.log("🔌 MongoDB desconectado");
});
