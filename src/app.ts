import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import mongoose from "mongoose";
import { apiReference } from "@scalar/express-api-reference";

import routes from "./routes";
import errorHandler from "./middlewares/errorHandler";
import { openApiSpec } from "./openapi";

const app: Application = express();

// Servir archivos estáticos (favicon)
app.use(express.static(path.join(__dirname, "..", "public")));

// Middlewares de seguridad y utilidades
app.use(
    helmet({
        contentSecurityPolicy: false, // Deshabilitar CSP para Scalar
        crossOriginEmbedderPolicy: false,
    }),
);
app.use(cors());
app.use(morgan("dev"));

// Parseo de JSON y URL encoded
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rutas principales
app.use("/api", routes);

// Favicon explícito
app.get("/favicon.ico", (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "..", "public", "favicon.svg"));
});

// Documentación de API con Scalar
app.get("/openapi.json", (_req: Request, res: Response) => {
    res.json(openApiSpec);
});

app.use(
    "/docs",
    apiReference({
        theme: "kepler",
        spec: {
            content: openApiSpec,
        },
    }),
);

// Ruta de health check
app.get("/health", (_req: Request, res: Response) => {
    const mongoState = mongoose.connection.readyState;
    const mongoStatus: Record<number, string> = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    };

    res.status(mongoState === 1 ? 200 : 503).json({
        status: mongoState === 1 ? "OK" : "DEGRADED",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: mongoStatus[mongoState] ?? "unknown",
    });
});

// Manejo de rutas no encontradas
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "Ruta no encontrada",
    });
});

// Middleware de manejo de errores
app.use(errorHandler);

export default app;
