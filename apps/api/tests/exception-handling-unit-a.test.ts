/**
 * WAYNAH — Phase 10 Unit A — Exception Handling & Taxonomy Framework Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  NotFoundError,
  ErrorCodes,
  ExceptionFamilies,
  DomainError,
  TransactionException,
  FulfillmentDeliveryException,
  FinancialPaymentException,
  GeographicCoverageException,
  EntityOperationalException,
  TrustDataModerationException,
  ApiResponseBuilder,
} from '@waynah/shared';
import { ExceptionHandler } from '../src/domain/operations/exception-handler.js';

describe('WAYNAH Phase 10 Unit A — Exception Handling & Taxonomy Framework', () => {
  // 1. Domain Error Classes Construction & Property Integrity
  it('1. Correctly constructs domain exceptions for all 6 LOGIC-008 families', () => {
    const txnErr = new TransactionException('Order cancelled by user', ErrorCodes.TRANSACTION_CANCELLED, { orderId: 'ord-1' });
    expect(txnErr.family).toBe(ExceptionFamilies.TRANSACTION_INTERACTION);
    expect(txnErr.code).toBe('TRANSACTION_CANCELLED');
    expect(txnErr.statusCode).toBe(400);

    const fulErr = new FulfillmentDeliveryException('Customer unreachable', ErrorCodes.DELIVERY_CUSTOMER_UNREACHABLE);
    expect(fulErr.family).toBe(ExceptionFamilies.FULFILLMENT_DELIVERY);
    expect(fulErr.code).toBe('DELIVERY_CUSTOMER_UNREACHABLE');

    const finErr = new FinancialPaymentException('Payment failed', ErrorCodes.PAYMENT_FAILED);
    expect(finErr.family).toBe(ExceptionFamilies.FINANCIAL_PAYMENT);
    expect(finErr.code).toBe('PAYMENT_FAILED');

    const geoErr = new GeographicCoverageException('Location outside coverage area', ErrorCodes.GEOGRAPHIC_MISMATCH);
    expect(geoErr.family).toBe(ExceptionFamilies.GEOGRAPHIC_COVERAGE);
    expect(geoErr.code).toBe('GEOGRAPHIC_MISMATCH');

    const opsErr = new EntityOperationalException('Business permanently closed', ErrorCodes.BUSINESS_CLOSED);
    expect(opsErr.family).toBe(ExceptionFamilies.ENTITY_OPERATIONAL);
    expect(opsErr.code).toBe('BUSINESS_CLOSED');

    const truErr = new TrustDataModerationException('Conflicting ownership claim', ErrorCodes.DISPUTED_OWNERSHIP);
    expect(truErr.family).toBe(ExceptionFamilies.TRUST_DATA_MODERATION);
    expect(truErr.code).toBe('DISPUTED_OWNERSHIP');
    expect(truErr.statusCode).toBe(409);
  });

  // 2. Client-Safe Response Formatting & AppError Inheritance
  it('2. Domain exceptions produce client-safe responses compatible with AppError contract', () => {
    const err = new TransactionException('Invalid request state', ErrorCodes.TRANSACTION_CANCELLED, { hint: 'retry later' });

    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(DomainError);

    const response = err.toClientResponse();
    expect(response.success).toBe(false);
    expect(response.error.code).toBe('TRANSACTION_CANCELLED');
    expect(response.error.message).toBe('Invalid request state');
    expect(response.error.details).toEqual({ hint: 'retry later' });
  });

  // 3. ExceptionHandler Classification of Domain Exceptions
  it('3. ExceptionHandler.classify correctly maps domain exceptions to their LOGIC-008 family', () => {
    const geoErr = new GeographicCoverageException('Out of zone', ErrorCodes.GEOGRAPHIC_MISMATCH);
    const classified = ExceptionHandler.classify(geoErr);

    expect(classified.family).toBe(ExceptionFamilies.GEOGRAPHIC_COVERAGE);
    expect(classified.code).toBe('GEOGRAPHIC_MISMATCH');
    expect(classified.statusCode).toBe(400);
    expect(classified.isOperational).toBe(true);
  });

  // 4. Backward Compatibility with Existing AppError Hierarchy
  it('4. ExceptionHandler correctly handles existing AppError instances (ValidationError, NotFoundError)', () => {
    const valErr = new ValidationError('Invalid input field', { field: 'nameAr' });
    const classifiedVal = ExceptionHandler.classify(valErr);
    expect(classifiedVal.family).toBe('INFRASTRUCTURE');
    expect(classifiedVal.code).toBe('VALIDATION_ERROR');
    expect(classifiedVal.statusCode).toBe(400);

    const notFound = new NotFoundError('Place not found');
    const handled = ExceptionHandler.handle(notFound);
    expect(handled.success).toBe(false);
    expect(handled.error.code).toBe('NOT_FOUND');
    expect(handled.error.message).toBe('Place not found');
  });

  // 5. Unknown & Non-Operational Error Masking (No Leak of Internal Details)
  it('5. ExceptionHandler masks unmapped / internal errors safely without leaking internal diagnostics', () => {
    const rawError = new Error('Database connection string password leaked: secret123');
    
    const classified = ExceptionHandler.classify(rawError);
    expect(classified.family).toBe('UNKNOWN');
    expect(classified.code).toBe('INTERNAL_SERVER_ERROR');
    expect(classified.statusCode).toBe(500);
    expect(classified.isOperational).toBe(false);

    const handled = ExceptionHandler.handle(rawError);
    expect(handled.success).toBe(false);
    expect(handled.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(handled.error.message).toBe('An internal server error occurred');
    expect(handled.error.details).toBeUndefined();
  });

  // 6. ExceptionHandler.isOperational Checks
  it('6. ExceptionHandler.isOperational accurately identifies operational vs fatal system errors', () => {
    const domainErr = new EntityOperationalException('Business closed');
    const appErr = new ValidationError('Bad request');
    const nativeErr = new Error('Fatal memory allocation failure');

    expect(ExceptionHandler.isOperational(domainErr)).toBe(true);
    expect(ExceptionHandler.isOperational(appErr)).toBe(true);
    expect(ExceptionHandler.isOperational(nativeErr)).toBe(false);
  });

  // 7. Backward Compatibility with ApiResponseBuilder
  it('7. Maintains 100% backward compatibility with ApiResponseBuilder.error format', () => {
    const res = ApiResponseBuilder.error('Custom message', ErrorCodes.BAD_REQUEST, { foo: 'bar' });
    expect(res).toEqual({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Custom message',
        details: { foo: 'bar' },
      },
    });
  });
});
