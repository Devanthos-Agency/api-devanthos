import mongoose from "mongoose";
import dns from "dns";

// Forzar DNS públicos de Google para resolver registros SRV de Atlas
// en redes con firewalls o DNS que no soporten SRV
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

export async function connectMongoDB(): Promise<void> {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error("La variable de entorno MONGODB_URI no está definida");
    }

    await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });
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
