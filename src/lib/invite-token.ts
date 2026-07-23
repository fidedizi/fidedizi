import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateInviteToken() {
  return {
    token: crypto.randomBytes(32).toString("hex"),
    expiresAt: new Date(Date.now() + INVITE_TOKEN_TTL_MS),
  };
}

export function buildInviteLink(token: string) {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3001";
  return `${baseUrl}/ativar-conta?token=${token}`;
}

// Placeholder inutilizável: ninguém pode logar com essa senha, já que o
// usuário precisa acessar o link de ativação para definir a senha real.
export function generateUnusablePasswordHash() {
  return bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
}
