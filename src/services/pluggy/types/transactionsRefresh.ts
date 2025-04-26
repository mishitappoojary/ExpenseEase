export type TransactionFilters = {
  start_date: string;
  end_date: string;
  account_ids?: string[];
  count?: number;
  offset?: number;
};
