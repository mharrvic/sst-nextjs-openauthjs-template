import { APIGatewayProxyEventV2 } from "aws-lambda";
// import { db } from "~/db/drizzle";

export const handler = async (evt: APIGatewayProxyEventV2) => {
  if (evt.requestContext.http.method === "GET") {
    // const result = await db.select().from(todo).execute();

    return {
      statusCode: 200,
      body: JSON.stringify("test", null, 2),
    };
  }

  if (evt.requestContext.http.method === "POST") {
    return {
      statusCode: 200,
      body: JSON.stringify("test", null, 2),
    };
  }
};
