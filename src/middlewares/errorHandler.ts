import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utils/errors";

/**
 * Middleware centralizado para manejo de errores.
 * - Errores operacionales (AppError): devuelve el statusCode y mensaje controlado.
 * - Errores inesperados: devuelve 500 sin filtrar detalles en producción.
 */
const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err instanceof ValidationError &&
                err.errors && { errors: err.errors }),
        });
        return;
    }

    // Error inesperado — logear stack completo
    console.error("Error no controlado:", err);

    const message =
        process.env.NODE_ENV === "production"
            ? "Error interno del servidor"
            : err.message;

    res.status(500).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

export default errorHandler;
