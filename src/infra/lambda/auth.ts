import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { authorizer } from "@openauthjs/openauth";
import { PasswordAdapter } from "@openauthjs/openauth/adapter/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { handle } from "hono/aws-lambda";
import { subjects } from "~/auth/subjects";

// Initialize the low-level DynamoDB client
const client = new DynamoDBClient({ region: "ap-southeast-1" });

// Function to get an item by pk and sk
const getItemByPkAndSk = async (email: string) => {
  const pkValue = `email\x1F${email}`;
  const skValue = "subject";

  console.log(`Getting item with pk: "${pkValue}" and sk: "${skValue}"`);

  try {
    const response = await client.send(
      new GetItemCommand({
        TableName: "mac-support-mac-MyAuthStorageTable",
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

async function getUser(email: string) {
  try {
    const item = await getItemByPkAndSk(email);

    if (item) {
      console.log("Item found via GetItem:", item);
      const value = JSON.parse(item.value?.S ?? "") as string;
      return value.replace("user:", "");
    }

    return "";
  } catch (error) {
    console.log({ error });
  }
}

const app = authorizer({
  subjects,
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
      console.log({ value });
      return ctx.subject("user", {
        id: await getUser(value.email),
      });
    }
    throw new Error("Invalid provider");
  },
});

export const handler = handle(app);
