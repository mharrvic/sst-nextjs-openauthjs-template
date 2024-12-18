"use client";

export default function Form({ url }: { url: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-sm"
        onSubmit={async (e) => {
          e.preventDefault();

          const file = (e.target as HTMLFormElement).file.files?.[0] ?? null;

          if (!file) {
            alert("Please select a file to upload.");
            return;
          }

          try {
            const response = await fetch(url, {
              body: file,
              method: "PUT",
              headers: {
                "Content-Type": file.type,
                "Content-Disposition": `attachment; filename="${file.name}"`,
              },
            });

            if (!response.ok) {
              throw new Error("Upload failed.");
            }

            const imageUrl = response.url.split("?")[0];
            window.location.href = imageUrl;
          } catch (error) {
            console.error(error);
            alert("There was an error uploading your file.");
          }
        }}
      >
        <h2 className="text-2xl mb-6 text-center text-gray-700">
          Upload Image
        </h2>
        <div className="mb-4">
          <label
            htmlFor="file"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Select Image
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/png, image/jpeg"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
          >
            Upload
          </button>
        </div>
      </form>
    </div>
  );
}
