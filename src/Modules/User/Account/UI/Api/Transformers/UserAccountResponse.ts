import { UserAccountDTO } from '../../../Domain/DTOs/UserAccountDTO';

/** Response-Formatierung: DTO → nach außen ausgeliefertes JSON. */
export class UserAccountResponse {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly status: string,
    public readonly roles: string[],
    public readonly createdAt: string,
    public readonly updatedAt: string,
  ) {}

  static fromDTO(dto: UserAccountDTO): UserAccountResponse {
    return new UserAccountResponse(
      dto.id,
      dto.email,
      dto.status,
      dto.roles,
      dto.createdAt.toISOString(),
      dto.updatedAt.toISOString(),
    );
  }
}
