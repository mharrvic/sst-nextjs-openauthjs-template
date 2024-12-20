import { createClient } from "@openauthjs/openauth/client";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";

const client = createClient({
  clientID: "mac-support",
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const subjects = {
  user: {
    "~standard": {
      validate: (properties: { id?: string }) => {
        if (typeof properties.id === "string") {
          console.log("Validated properties:", properties);
          return { issues: null, value: properties };
        }
        console.error("Invalid properties:", properties);
        return { issues: "Invalid properties" };
      },
    },
  },
};

const app = new Hono()
  .get("/authorize", async (c) => {
    try {
      const origin = new URL(c.req.url).origin;
      console.log({ origin });

      const { url } = await client.authorize(`${origin}/callback`, "code");
      console.log({ url });

      return c.json({ url });
    } catch (error) {
      console.log({ error });
      return c.text("Authorization error", 500);
    }
  })
  .get("/callback", async (c) => {
    console.log("Callback");
    const origin = new URL(c.req.url).origin;
    console.log({ origin });

    try {
      const code = c.req.query("code");
      if (!code) throw new Error("Missing code");

      const exchanged = await client.exchange(code, `${origin}/callback`);
      if (exchanged.err) {
        return new Response(exchanged.err.toString(), {
          status: 400,
        });
      }

      const { access, refresh } = exchanged.tokens;

      console.log("Redirecting with tokens: ", { access, refresh });
      const redirectUrl = `${origin}/?access_token=${access}&refresh_token=${refresh}`;

      return c.redirect(redirectUrl, 302);
    } catch (e) {
      console.error(e);
      return c.text("Callback error", 500);
    }
  })
  .get("/", async (c) => {
    const access = c.req.query("access_token");
    const refresh = c.req.query("refresh_token");
    console.log({ access, refresh });

    let accessToken = access;
    let refreshToken = refresh;

    try {
      // @ts-expect-error Overriding the default subject type
      const verified = await client.verify(subjects, access!, { refresh });
      console.log({ verified });

      if (verified.err) throw new Error("Invalid access token");
      if (verified.tokens) {
        accessToken = verified.tokens.access;
        refreshToken = verified.tokens.refresh;
      }

      console.log(`Redirecting to frontend at ${FRONTEND_URL}`);

      // Redirect to the nextjs api with the new tokens as params
      const urlWithTokensParams = `${FRONTEND_URL}/api/token?access_token=${accessToken}&refresh_token=${refreshToken}&subject=${JSON.stringify(
        verified.subject
      )}`;

      return c.redirect(urlWithTokensParams, 302);
    } catch (e) {
      console.error(e);
      return c.redirect("/authorize", 302);
    }
  })
  .get("/verify", async (c) => {
    const accessToken = c.req.header("x-access-token");
    const refreshToken = c.req.header("x-refresh-token");

    if (!accessToken) {
      return c.json({ error: "Missing access token in headers" }, 400);
    }

    // @ts-expect-error Overriding the default subject type
    const verified = await client.verify(subjects, accessToken, {
      refresh: refreshToken,
    });

    if (verified.err) {
      console.error("Verification failed:", verified.err);
      return c.json(
        { error: verified.err, subject: undefined, tokens: undefined },
        400
      );
    }

    console.log({ verified });

    return c.json({
      subject: verified.subject,
      tokens: verified.tokens,
      error: undefined,
    });
  });

export const handler = handle(app);
