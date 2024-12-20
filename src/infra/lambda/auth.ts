import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { authorizer } from "@openauthjs/openauth";
import { PasswordAdapter } from "@openauthjs/openauth/adapter/password";
import { DynamoStorage } from "@openauthjs/openauth/storage/dynamo";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { Theme } from "@openauthjs/openauth/ui/theme";

import { handle } from "hono/aws-lambda";
import { Resource } from "sst";
import { subjects } from "~/auth/subjects";
import { db } from "~/db/drizzle";
import { users } from "~/db/schema.sql";

export const THEME_MAC_SUPPORT: Theme = {
  title: "Mac Support",
  logo: {
    dark: "https://vercel.com/mktng/_next/static/media/vercel-logotype-dark.e8c0a742.svg",
    light:
      "https://vercel.com/mktng/_next/static/media/vercel-logotype-light.700a8d26.svg",
  },
  background: {
    dark: "black",
    light: "white",
  },
  primary: {
    dark: "white",
    light: "black",
  },
  font: {
    family: "Geist, sans-serif",
  },
  css: `
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@100;200;300;400;500;600;700;800;900&display=swap');
  `,
};

// Initialize the low-level DynamoDB client
const client = new DynamoDBClient({ region: "ap-southeast-1" });

// Function to get an item by pk and sk
const getItemByPkAndSk = async (email: string) => {
  const pkValue = `email\x1F${email}`;
  const skValue = "subject";

  try {
    const response = await client.send(
      new GetItemCommand({
        TableName: Resource.LambdaAuthTable.name,
        Key: {
          pk: { S: pkValue },
          sk: { S: skValue },
        },
      })
    );

    const item = response.Item;

    return item;
  } catch (error) {
    console.error("Error getting item from DynamoDB:", error);
    throw error;
  }
};

export async function saveUser(email: string): Promise<void> {
  const now = new Date();

  try {
    await db
      .insert(users)
      .values({
        email,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: users.email, // Specify the unique constraint to check conflict
        set: {
          lastSigninAt: now, // Update lastSigninAt to current timestamp
        },
      })
      .execute();

    console.log(`User with email ${email} has been saved successfully.`);
  } catch (error) {
    console.error(`Error saving user with email ${email}:`, error);
    throw error; // Re-throw the error after logging it
  }
}

async function getUser(email: string) {
  const item = await getItemByPkAndSk(email);

  if (item) {
    console.log("Item found via GetItem:", item);
    const value = JSON.parse(item.value?.S ?? "") as string;
    return value.replace("user:", "");
  }

  return "";
}

const app = authorizer({
  storage: DynamoStorage({
    table: Resource.LambdaAuthTable.name,
  }),
  subjects,
  theme: THEME_MAC_SUPPORT,
  providers: {
    password: PasswordAdapter(
      PasswordUI({
        sendCode: async (email, code) => {
          console.log(email, code);
        },
      })
    ),
  },
  success: async (ctx, value) => {
    if (value.provider === "password") {
      await saveUser(value.email);
      // @ts-expect-error - Overriding the default subjects
      return ctx.subject("user", {
        id: await getUser(value.email),
      });
    }
    throw new Error("Invalid provider");
  },
});

export const handler = handle(app);
