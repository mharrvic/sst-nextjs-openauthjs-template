import { type NextRequest, NextResponse } from "next/server";
import { setTokens } from "~/app/auth";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const accessToken = url.searchParams.get("access_token") ?? "";
    const refreshToken = url.searchParams.get("refresh_token") ?? "";

    await setTokens(accessToken, refreshToken);
    return NextResponse.redirect(`${url.origin}/`);
  } catch (error) {
    console.error({ error });
    return NextResponse.json({ error });
  }
}
