const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());
const { getToken, decode } = require("next-auth/jwt");

const cookieToken = process.argv[2];
if (!cookieToken) {
  console.error("Usage: node scripts/check-jwt.js <cookie-value-of-next-auth.session-token>");
  process.exit(1);
}

(async () => {
  const secret = process.env.NEXTAUTH_SECRET;
  console.log("secret length:", secret?.length, "first8:", secret?.slice(0, 8));
  console.log("token length:", cookieToken.length);

  try {
    const decoded = await decode({
      token: cookieToken,
      secret,
      salt: "next-auth.session-token",
    });
    console.log("decode() result:", decoded);
  } catch (e) {
    console.log("decode() threw:", e.message);
  }

  try {
    const decodedNoSalt = await decode({ token: cookieToken, secret });
    console.log("decode() no-salt result:", decodedNoSalt);
  } catch (e) {
    console.log("decode() no-salt threw:", e.message);
  }

  const fakeReq = { headers: { cookie: `next-auth.session-token=${cookieToken}` } };
  const via = await getToken({ req: fakeReq, secret });
  console.log("getToken() result:", via);
})();
