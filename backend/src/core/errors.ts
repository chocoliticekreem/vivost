export class AppError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("not_found", message);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super("validation_error", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super("conflict", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super("forbidden", message);
  }
}
