import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SALT_BYTES = 16;
const KEY_BYTES = 64;

function derivar(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_BYTES, (error, key) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(key);
    });
  });
}

/** Hash `salt:hash`, ambos en base64url, sin dependencias nativas. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derivar(password, salt);
  return `${salt.toString("base64url")}:${key.toString("base64url")}`;
}

/** Devuelve false ante formato inválido, longitudes distintas o fallo de scrypt. */
export async function verifyPassword(password: string, almacenado: string): Promise<boolean> {
  try {
    const partes = almacenado.split(":");
    if (partes.length !== 2) return false;

    const saltTexto = partes[0];
    const hashTexto = partes[1];
    if (saltTexto === undefined || hashTexto === undefined) return false;

    const salt = Buffer.from(saltTexto, "base64url");
    const esperado = Buffer.from(hashTexto, "base64url");
    if (salt.length !== SALT_BYTES || esperado.length !== KEY_BYTES) return false;

    const obtenido = await derivar(password, salt);
    return obtenido.length === esperado.length && timingSafeEqual(obtenido, esperado);
  } catch {
    return false;
  }
}
