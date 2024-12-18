/// <reference path="./.sst-back/platform/config.d.ts" />

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
    const bucket = new sst.aws.Bucket("MyBucket", {
      access: "public",
    });
    new sst.aws.Nextjs("MyWeb", {
      link: [bucket],
    });
  },
});
