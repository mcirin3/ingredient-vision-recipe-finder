export type User = {
  id: number;
  email: string;
  mfa_enabled: boolean;
  created_at: string;
};

export type AuthTokens = {
  access_token: string;
  token_type: string;
};

export type AuthResponse = {
  user: User;
} & AuthTokens;

export type MfaSetup = {
  secret: string;
  otpauth_url: string;
};
