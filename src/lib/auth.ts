import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { jwt } from 'better-auth/plugins';

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
  plugins: [
    jwt({
      jwks: {
        keyPairConfig: { alg: 'RS256' },
      },
      jwt: {
        issuer: baseURL,
        audience: 'puzo-backend',
      },
    }),
  ],
});
