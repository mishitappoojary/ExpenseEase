export type Identity = {
  names?: string[];
  emails?: {
    data: string;
    primary: boolean;
    type?: string;
  }[];
  phone_numbers?: {
    data: string;
    primary: boolean;
    type?: string;
  }[];
  addresses?: {
    data: {
      city: string;
      region: string;
      street: string;
      postal_code: string;
      country: string;
    };
    primary: boolean;
  }[];
};
