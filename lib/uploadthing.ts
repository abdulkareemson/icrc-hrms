// lib/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/server";
import { getSession } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  // Profile photo upload — images only, max 4MB
  profilePhoto: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await getSession();
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(
        "✅ Profile photo uploaded:",
        file.key,
        "by user:",
        metadata.userId,
      );
      return { fileKey: file.key, fileUrl: file.ufsUrl };
    }),

  // Document upload — PDF, images, max 16MB
  document: f({
    "application/pdf": { maxFileSize: "16MB", maxFileCount: 1 },
    "image/jpeg": { maxFileSize: "16MB", maxFileCount: 1 },
    "image/png": { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await getSession();
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(
        "✅ Document uploaded:",
        file.key,
        "by user:",
        metadata.userId,
      );
      return { fileKey: file.key, fileUrl: file.ufsUrl };
    }),

  // CV/Resume upload — PDF only, max 8MB
  cv: f({
    "application/pdf": { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      // Public — no auth required for job applications
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      console.log("✅ CV uploaded:", file.key);
      return { fileKey: file.key, fileUrl: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
