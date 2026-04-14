/**
 * Clases de error estandarizadas para la aplicación.
 * Se usan en controladores y servicios; el error handler las detecta automáticamente.
 */

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public isOperational: boolean = true,
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(
        message: string,
        public errors?: { field: string; message: string }[],
    ) {
        super(message, 400);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Recurso no encontrado") {
        super(message, 404);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = "No autorizado") {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = "Acceso denegado") {
        super(message, 403);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409);
    }
}
