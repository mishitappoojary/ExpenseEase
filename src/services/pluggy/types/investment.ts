export type Investment = {
  security_id: string;
  account_id: string;
  cost_basis: number;
  quantity: number;
  currency_code?: string;
};
