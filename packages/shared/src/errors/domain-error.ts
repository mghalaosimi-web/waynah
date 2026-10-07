import { AppError } from './app-error.js';
import { ErrorCodes, type ErrorCode } from '../constants/error-codes.js';

export const ExceptionFamilies = {
  TRANSACTION_INTERACTION: 'TRANSACTION_INTERACTION',
  FULFILLMENT_DELIVERY: 'FULFILLMENT_DELIVERY',
  FINANCIAL_PAYMENT: 'FINANCIAL_PAYMENT',
  GEOGRAPHIC_COVERAGE: 'GEOGRAPHIC_COVERAGE',
  ENTITY_OPERATIONAL: 'ENTITY_OPERATIONAL',
  TRUST_DATA_MODERATION: 'TRUST_DATA_MODERATION',
} as const;

export type ExceptionFamily = typeof ExceptionFamilies[keyof typeof ExceptionFamilies];

/**
  * Base Domain Exception for LOGIC-008 Phase 10 Taxonomy.
  * Extends AppError to maintain 100% compatibility with existing error response builders.
  */
export class DomainError extends AppError {
  public readonly family: ExceptionFamily;

  constructor(
    message: string,
    family: ExceptionFamily,
    code: ErrorCode | string = ErrorCodes.BAD_REQUEST,
    statusCode = 400,
    details?: unknown,
    isOperational = true
  ) {
    super(message, code, statusCode, details, isOperational);
    this.family = family;
  }
}

/** 1. Transaction & Interaction Exceptions */
export class TransactionException extends DomainError {
  constructor(message: string, code: ErrorCode | string = ErrorCodes.TRANSACTION_CANCELLED, details?: unknown) {
    super(message, ExceptionFamilies.TRANSACTION_INTERACTION, code, 400, details);
  }
}

/** 2. Fulfillment & Delivery Exceptions */
export class FulfillmentDeliveryException extends DomainError {
  constructor(message: string, code: ErrorCode | string = ErrorCodes.DELIVERY_CUSTOMER_UNREACHABLE, details?: unknown) {
    super(message, ExceptionFamilies.FULFILLMENT_DELIVERY, code, 400, details);
  }
}

/** 3. Financial & Payment Exceptions */
export class FinancialPaymentException extends DomainError {
  constructor(message: string, code: ErrorCode | string = ErrorCodes.PAYMENT_FAILED, details?: unknown) {
    super(message, ExceptionFamilies.FINANCIAL_PAYMENT, code, 400, details);
  }
}

/** 4. Geographic & Coverage Exceptions */
export class GeographicCoverageException extends DomainError {
  constructor(message: string, code: ErrorCode | string = ErrorCodes.GEOGRAPHIC_MISMATCH, details?: unknown) {
    super(message, ExceptionFamilies.GEOGRAPHIC_COVERAGE, code, 400, details);
  }
}

/** 5. Entity & Operational Status Exceptions */
export class EntityOperationalException extends DomainError {
  constructor(message: string, code: ErrorCode | string = ErrorCodes.BUSINESS_CLOSED, details?: unknown) {
    super(message, ExceptionFamilies.ENTITY_OPERATIONAL, code, 400, details);
  }
}

/** 6. Trust, Data & Moderation Exceptions */
export class TrustDataModerationException extends DomainError {
  constructor(message: string, code: ErrorCode | string = ErrorCodes.DISPUTED_OWNERSHIP, statusCode = 409, details?: unknown) {
    super(message, ExceptionFamilies.TRUST_DATA_MODERATION, code, statusCode, details);
  }
}
