import { createHash, randomBytes } from 'node:crypto';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';

import { env } from '../../config/env.js';
import { ApiError } from '../../utils/api-error.js';

function createClient(): OAuth2Client {
  const {
    GOOGLE_CLIENT_ID: clientId,
    GOOGLE_CLIENT_SECRET: clientSecret,
    GOOGLE_REDIRECT_URI: redirectUri,
  } = env;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new ApiError(503, 'GOOGLE_NOT_CONFIGURED', 'Login Google belum dikonfigurasi');
  }

  return new OAuth2Client({ clientId, clientSecret, redirectUri });
}

export function createGoogleAuthRequest(): { url: string; state: string; verifier: string } {
  const client = createClient();
  const state = randomBytes(32).toString('hex');
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');

  const url = client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
    state,
    code_challenge: challenge,
    code_challenge_method: CodeChallengeMethod.S256,
  });

  return { url, state, verifier };
}

export interface GoogleProfile {
  googleId: string;
  email: string;
}

export async function exchangeGoogleCode(code: string, verifier: string): Promise<GoogleProfile> {
  const client = createClient();
  const { tokens } = await client.getToken({ code, codeVerifier: verifier });

  if (!tokens.id_token) {
    throw new ApiError(401, 'GOOGLE_AUTH_FAILED', 'Login Google gagal');
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw new ApiError(401, 'GOOGLE_AUTH_FAILED', 'Login Google gagal');
  }

  return { googleId: payload.sub, email: payload.email.toLowerCase() };
}
