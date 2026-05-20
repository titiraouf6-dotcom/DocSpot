import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  certificate: f({ image: { maxFileSize: "4MB" }, pdf: { maxFileSize: "4MB" } })
    .onUploadComplete(async () => {
      // Certificate upload completed
    }),

  paymentProof: f({ image: { maxFileSize: "4MB" }, pdf: { maxFileSize: "4MB" } })
    .onUploadComplete(async () => {
      // Payment proof upload completed
    }),

  profileImage: f({ image: { maxFileSize: "4MB" } })
    .onUploadComplete(async () => {
      // Profile image upload completed
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
