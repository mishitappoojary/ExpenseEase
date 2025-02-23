export type AuthResponse = {
  numbers: {
    ach?: {
      account: string;
      routing: string;
      wire_routing?: string;
    }[];
    eft?: {
      account: string;
      institution: string;
      branch: string;
    }[];
    international?: {
      iban: string;
      bic: string;
    }[];
  };
};
