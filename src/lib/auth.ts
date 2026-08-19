import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { jwt } from 'better-auth/plugins';

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
const jwtIssuer = process.env.AUTH_ISSUER || (process.env.PUZO_API_BASE?.includes('probaho.site') ? 'https://dashboard.probaho.site' : baseURL);

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://dashboard.probaho.site',
  ],
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
        issuer: jwtIssuer,
        audience: 'puzo-backend',
      },
    }),
  ],
});
