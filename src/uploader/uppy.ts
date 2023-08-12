import { Hono } from "hono";
import { Bindings } from "../bindings";

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

app.post("/s3", (c) => {
  return c.text("test");
});

app.post("/s3-multipart", (c) => {
  return c.text("test");
});

app.post("/s3", (c) => {
  return c.text("test");
});

app.post("/s3", (c) => {
  return c.text("test");
});

export default app;
