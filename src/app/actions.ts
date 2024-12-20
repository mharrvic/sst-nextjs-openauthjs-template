"use server";

import { cookies as getCookies } from "next/headers";
import { redirect } from "next/navigation";
import { Resource } from "sst";
import { setTokens } from "./auth";

export async function auth() {
  const cookies = await getCookies();
  const accessToken = cookies.get("access_token");
  const refreshToken = cookies.get("refresh_token");

  if (!accessToken) {
    console.warn("No access token found.");
    return false;
  }

  const response = await fetch(`${Resource.LambdaAuthApi.url}verify`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": accessToken?.value || "",
      "x-refresh-token": refreshToken?.value || "",
    },
    credentials: "include",
  });

  const responseJson = (await response.json()) as {
    subject?: {
      type: string;
      properties: {
        id: string;
      };
    };
    tokens?: {
      access: string;
      refresh: string;
    };
    error?: string;
  };

  if (response.status === 400) {
    console.error("Verification failed with error:", responseJson.error);
    return false;
  }

  if (responseJson.tokens) {
    console.log("Setting new tokens:", responseJson.tokens);
    await setTokens(responseJson.tokens.access, responseJson.tokens.refresh);
  }

  return responseJson.subject;
}

export async function login() {
  const lambdaUrl = Resource.LambdaAuthApi.url;

  const response = await fetch(`${lambdaUrl}authorize`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  console.log({ response });

  const { url } = await response.json();

  console.log("Received data from /authorize:", url);

  console.log({ url });
  if (url) {
    redirect(url);
  } else {
    console.error("Unexpected response from /authorize:", url);
  }
}

export async function logout() {
  const cookies = await getCookies();
  cookies.delete("access_token");
  cookies.delete("refresh_token");

  redirect("/");
}
