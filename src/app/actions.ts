"use server";

import { cookies as getCookies, headers as getHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { client, setTokens, subjects } from "./auth";

export async function auth() {
  const cookies = await getCookies();
  const accessToken = cookies.get("access_token");
  const refreshToken = cookies.get("refresh_token");

  if (!accessToken) {
    console.warn("No access token found.");
    return false;
  }

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
  // @ts-expect-error - Overriding the default subjects
  const verified = await client.verify(subjects, accessToken.value, {
    refresh: refreshToken?.value,
  });

  console.log("Verification result:", verified);

  if (verified.err) {
    console.error("Verification failed with error:", verified.err);
    return false;
  }

  if (verified.tokens) {
    console.log("Setting new tokens:", verified.tokens);
    await setTokens(verified.tokens.access, verified.tokens.refresh);
  }

  return verified.subject;
}

export async function login() {
  const cookies = await getCookies();
  const accessToken = cookies.get("access_token");
  const refreshToken = cookies.get("refresh_token");

  if (accessToken) {
    const verified = await client.verify(subjects, accessToken.value, {
      refresh: refreshToken?.value,
    });
    if (!verified.err && verified.tokens) {
      await setTokens(verified.tokens.access, verified.tokens.refresh);
      redirect("/");
    }
  }

  const headers = await getHeaders();
  const host = headers.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const { url } = await client.authorize(
    `${protocol}://${host}/api/callback`,
    "code"
  );
  redirect(url);
}

export async function logout() {
  const cookies = await getCookies();
  cookies.delete("access_token");
  cookies.delete("refresh_token");

  redirect("/");
}
