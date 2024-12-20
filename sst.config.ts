/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "mac-support",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          profile: "mharrrrvic-dev",
        },
      },
    };
  },
  async run() {
    const vpc = new sst.aws.Vpc("MyVpc", { bastion: true, nat: "ec2" });
    const rds = new sst.aws.Postgres("MyPostgres", { vpc, proxy: true });

    const table = new sst.aws.Dynamo("LambdaAuthTable", {
      fields: {
        pk: "string",
        sk: "string",
      },
      ttl: "expiry",
      primaryIndex: {
        hashKey: "pk",
        rangeKey: "sk",
      },
    });
    const lambdaAuth = new sst.aws.Function("LambdaAuth", {
      vpc,
      handler: "src/infra/lambda/auth.handler",
      url: true,
      link: [table, rds],
    });

    const lambdaAuthApi = new sst.aws.Function("LambdaAuthApi", {
      handler: "src/infra/lambda/auth-api.handler",
      url: true,
      environment: {
        OPENAUTH_ISSUER: lambdaAuth.url.apply((v) => v!.replace(/\/$/, "")),
      },
    });

    const bucket = new sst.aws.Bucket("MyBucket", {
      access: "public",
    });
    new sst.aws.Nextjs("MyWeb", {
      link: [bucket, rds, lambdaAuth, lambdaAuthApi],
    });

    new sst.x.DevCommand("Studio", {
      link: [rds],
      dev: {
        command: "npx drizzle-kit studio",
      },
    });

    new sst.aws.Function("QueryApi", {
      vpc,
      url: true,
      link: [rds],
      handler: "src/infra/lambda/api.handler",
    });
  },
});
