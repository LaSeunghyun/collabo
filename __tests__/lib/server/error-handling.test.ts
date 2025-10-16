import { NextResponse } from 'next/server';
import {
  buildApiError,
  createTransactionWrapper,
  FundingSettlementError,
  handleFundingSettlementError,
  withErrorHandling
} from '@/lib/server/error-handling';

describe('error handling utilities', () => {
  const readJson = async (response: NextResponse) => ({
    status: response.status,
    body: await response.json()
  });

  it('formats funding settlement errors', async () => {
    const response = handleFundingSettlementError(
      new FundingSettlementError('정산 오류', 'SETTLEMENT_FAILED', 400, { issue: 'test' })
    );

    await expect(readJson(response)).resolves.toEqual({
      status: 400,
      body: {
        error: '정산 오류',
        code: 'SETTLEMENT_FAILED',
        details: { issue: 'test' }
      }
    });
  });

  it('maps known database errors to api responses', async () => {
    const duplicate = { code: 'P2002', message: 'duplicate' };
    const foreignKey = { code: 'P2003', message: 'fk' };
    const missing = { code: 'P2025', message: 'missing' };

    await expect(readJson(handleFundingSettlementError(duplicate))).resolves.toMatchObject({
      status: 409,
      body: { code: 'DUPLICATE_ENTRY' }
    });
    await expect(readJson(handleFundingSettlementError(foreignKey))).resolves.toMatchObject({
      status: 400,
      body: { code: 'FOREIGN_KEY_CONSTRAINT' }
    });
    await expect(readJson(handleFundingSettlementError(missing))).resolves.toMatchObject({
      status: 404,
      body: { code: 'NOT_FOUND' }
    });
  });

  it('handles validation errors', async () => {
    const validation = { message: 'validation error' };

    await expect(readJson(handleFundingSettlementError(validation))).resolves.toMatchObject({
      status: 400,
      body: { code: 'VALIDATION_ERROR' }
    });
  });

  it('falls back to internal error for unknown issues', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(readJson(handleFundingSettlementError(new Error('boom')))).resolves.toMatchObject({
      status: 500,
      body: { code: 'INTERNAL_ERROR' }
    });
    errorSpy.mockRestore();
  });

  it('wraps operations and forwards success values', async () => {
    const value = await withErrorHandling(async () => 42);
    expect(value).toBe(42);
  });

  it('allows custom error handlers in withErrorHandling', async () => {
    const response = await withErrorHandling(async () => {
      throw new Error('oops');
    }, () => buildApiError('custom', 418, 'TEAPOT'));

    await expect(readJson(response as NextResponse)).resolves.toEqual({
      status: 418,
      body: { error: 'custom', code: 'TEAPOT', details: undefined }
    });
  });

  it('transaction wrapper delegates to withErrorHandling', async () => {
    const operation = jest.fn().mockResolvedValue('result');
    const wrapped = createTransactionWrapper(operation);
    const outcome = await wrapped('a', 'b');

    expect(operation).toHaveBeenCalledWith('a', 'b');
    expect(outcome).toBe('result');
  });
});
