/**
 * Basisklasse für fachliche (Domain-)Exceptions. Framework-frei.
 * `code` ist ein stabiler, maschinenlesbarer Fehlercode; `status` der
 * passende HTTP-Status (als reine Zahl, ohne Framework-Kopplung).
 */
export abstract class DomainException extends Error {
  abstract readonly code: string;
  abstract readonly status: number;
  readonly details?: Record<string, unknown>;

  protected constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = new.target.name;
    if (details) {
      this.details = details;
    }
  }
}
