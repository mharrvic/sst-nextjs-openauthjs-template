import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import Image from "next/image";
import { Resource } from "sst";
import { auth, login, logout } from "./actions";
import Form from "./components/form";

export const dynamic = "force-dynamic";

export default async function Home() {
  const subject = await auth();

  const command = new PutObjectCommand({
    Key: crypto.randomUUID(),
    Bucket: Resource.MyBucket.name,
  });
  const url = await getSignedUrl(new S3Client({}), command);

  console.log({ subject });

  return (
    <div className="m-2">
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="flex flex-col items-center space-y-4">
          <Image
            className="h-10 w-auto"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <ol className="list-decimal space-y-2 text-gray-800">
            {subject ? (
              <>
                <li>
                  Logged in as{" "}
                  <code className="bg-gray-100 px-1 py-0.5 rounded">
                    {subject.properties.id}
                  </code>
                  .
                </li>
                <li>
                  And then check out{" "}
                  <code className="bg-gray-100 px-1 py-0.5 rounded">
                    app/page.tsx
                  </code>
                  .
                </li>
              </>
            ) : (
              <>
                <li>Login with your email and password.</li>
                <li>
                  And then check out{" "}
                  <code className="bg-gray-100 px-1 py-0.5 rounded">
                    app/page.tsx
                  </code>
                  .
                </li>
              </>
            )}
          </ol>

          <div>
            {subject ? (
              <form action={logout}>
                <button className="px-4 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition-colors">
                  Logout
                </button>
              </form>
            ) : (
              <form action={login}>
                <button className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors">
                  Login with OpenAuth
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <main className="p-2">
        <Form url={url} />
      </main>
    </div>
  );
}
