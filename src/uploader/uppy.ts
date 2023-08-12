import { Hono } from "hono";
import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  ListPartsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { Bindings } from "../bindings";
import { generateFilenameWithExtension } from "../util/filename";

// This file implements the following routes:
// POST > /s3: get parameters and pre-signed URL for non-multipart upload.
// POST > /s3-multipart: create the multipart upload.
// GET > /s3-multipart/:id: get the uploaded parts.
// GET > /s3-multipart/:id/:partNumber: sign the part and return a pre-signed URL.
// POST > /s3-multipart/:id/complete: complete the multipart upload.
// DELETE > /s3-multipart/:id: abort the multipart upload.
//
// Unimplemented:
// GET > /sts: get the temporary security credentials (optional).

const app = new Hono<{ Bindings: Bindings }>();

const makeS3 = (bindings: Bindings) => {
  const endpoint = `https://${bindings.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const accessKeyId = bindings.R2_ACCESS_KEY;
  const secretAccessKey = bindings.R2_SECRET_KEY;

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

app.post("/s3", async (c) => {
  type NonMultipartUpload = { file: { name: string; type: string } };
  const { file } = await c.req.json<NonMultipartUpload>();
  const filename = generateFilenameWithExtension(file.type, file.name);

  const s3 = makeS3(c.env);
  const cmd = new PutObjectCommand({
    Bucket: c.env.R2_BUCKET_NAME,
    Key: filename,
    Metadata: {
      uploader: "aster",
      "source-ray": c.req.header("cf-ray")!,
      "source-file": file.name,
    },
    ContentType: file.type,
  });

  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 60 * 24 * 7 });
  const location = c.env.PUBLIC_BUCKET_URL + "/" + filename;

  return c.json({
    method: "PUT",
    url,
    headers: {
      "Content-Type": file.type,
    },
    location,
  });
});

app.post("/s3-multipart", async (c) => {
  type MultipartUpload = { file: { name: string; type: string } };
  const { file } = await c.req.json<MultipartUpload>();
  const filename = generateFilenameWithExtension(file.type, file.name);

  const s3 = makeS3(c.env);
  const res = await s3.send(
    new CreateMultipartUploadCommand({
      Bucket: c.env.R2_BUCKET_NAME,
      Key: filename,
      Metadata: {
        uploader: "aster",
        "source-ray": c.req.header("cf-ray")!,
        "source-file": file.name,
      },
      ContentType: file.type,
    })
  );

  return c.json({ uploadId: res.UploadId, key: filename });
});

app.get("/s3-multipart/:id", async (c) => {
  type ListParts = { key: string };
  const { id } = c.req.param();
  const { key } = await c.req.json<ListParts>();

  const s3 = makeS3(c.env);
  const parts = await s3.send(
    new ListPartsCommand({
      Bucket: c.env.R2_BUCKET_NAME,
      Key: key,
      UploadId: id,
    })
  );

  return c.json(
    parts.Parts?.map((part) => ({
      PartNumber: part.PartNumber,
      Size: part.Size,
      ETag: part.ETag,
    }))
  );
});

app.post("/s3-multipart/:id/complete", async (c) => {
  type CompleteMultipart = {
    key: string;
    parts: { ETag: string; PartNumber: number }[];
  };
  const { id } = c.req.param();
  const { key, parts } = await c.req.json<CompleteMultipart>();

  const s3 = makeS3(c.env);
  const res = await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: c.env.R2_BUCKET_NAME,
      Key: key,
      UploadId: id,
      MultipartUpload: {
        Parts: parts,
      },
    })
  );

  const url = c.env.PUBLIC_BUCKET_URL + "/" + res.Key; // TODO
  return c.json({ location: url });
});

app.post("/s3-multipart/:id/:partNumber", async (c) => {
  type PartData = { key: string };
  const { id, partNumber } = c.req.param();
  const { key } = await c.req.json<PartData>();

  const s3 = makeS3(c.env);

  const cmd = new UploadPartCommand({
    Bucket: c.env.R2_BUCKET_NAME,
    Key: key,
    PartNumber: Number.parseInt(partNumber),
    UploadId: id,
  });

  const url = await getSignedUrl(s3, cmd);
  return c.json({ url });
});

app.delete("/s3-multipart/:id", async (c) => {
  type DeleteMultipart = { key: string };
  const { id } = c.req.param();
  const { key } = await c.req.json<DeleteMultipart>();

  const s3 = makeS3(c.env);
  await s3.send(
    new AbortMultipartUploadCommand({
      Bucket: c.env.R2_BUCKET_NAME,
      Key: key,
      UploadId: id,
    })
  );

  return c.text("OK");
});

export default app;
