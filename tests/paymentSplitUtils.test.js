import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePaymentSplit } from '../src/utils/paymentSplitUtils.js';

test('accepts a fully allocated split across cash, POS, and open account', () => {
  assert.equal(validatePaymentSplit(100, {
    cashAmount: 40,
    posAmount: 35,
    openAccountAmount: 25,
  }), null);
});

test('rejects an overallocated split', () => {
  assert.match(validatePaymentSplit(100, {
    cashAmount: 100,
    posAmount: 0.01,
    openAccountAmount: 0,
  }), /aşıyor/);
});

test('rejects an underallocated split', () => {
  assert.match(validatePaymentSplit(100, {
    cashAmount: 50,
    posAmount: 20,
    openAccountAmount: 20,
  }), /kalan/);
});

test('rejects negative and non-finite amounts', () => {
  assert.match(validatePaymentSplit(100, {
    cashAmount: -1,
    posAmount: 50,
    openAccountAmount: 51,
  }), /geçerli sayılar/);
  assert.match(validatePaymentSplit(100, {
    cashAmount: Number.NaN,
    posAmount: 100,
    openAccountAmount: 0,
  }), /geçerli sayılar/);
});
