## SST - Next.js - OpenAuthJS Template

SST - https://sst.dev
OpenAuthJs - http://openauth.js.org
NextJS - https://nextjs.org

## Getting Started

Prerequisite: Follow this instruction to setup your AWS account https://sst.dev/docs/aws-accounts/

1. Authenticate with AWS sso `npm run sso` (modify the sso session)
2. Install the dependencies `npm install`
3. Deploy the stack `npm run sst-dev`
4. On a new terminal, run the database migration `npm run db migrate`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Why build this template?

Just to make it easier to start a new project with SST, Next.js and OpenAuthJS. Took me a week to figure out how to make it work together because of the AWS, SST, and OpenAuthJs setup. So I decided to make a template for it.

OpenAuthJs has potential to be a great library for authentication, but it's not well documented yet and the setup is a bit tricky if you want to go with not using the SST Auth component (like i did, since i have to set a custom link --postgres with vpc-- and permission to the lambda).

For now, i might just use https://authjs.dev + neon db + drizzle + nextjs. But i'll keep an eye on OpenAuthJs.
