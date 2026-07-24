// Globales Test-Setup: deterministische Env-Variablen für Auth.
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '3600s';
process.env.NODE_ENV = 'test';

jest.setTimeout(30000);
