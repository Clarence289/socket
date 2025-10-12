describe('Basic Tests', () => {
  it('should run a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});