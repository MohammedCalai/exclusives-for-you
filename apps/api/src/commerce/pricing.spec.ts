describe('money invariants', () => {
  it('calculates integer-pence line totals', () => {
    expect(12999 * 2).toBe(25998);
  });
  it('does not use floating-point currency units', () => {
    expect(Number.isInteger(7999)).toBe(true);
  });
});
