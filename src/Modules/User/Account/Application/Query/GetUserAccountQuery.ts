/** Query: ein Nutzer-Konto per Id lesen. */
export class GetUserAccountQuery {
  constructor(public readonly id: string) {}
}
