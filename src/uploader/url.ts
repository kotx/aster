import { Hono } from "hono";
import { Bindings } from "../bindings";
import { Layout } from "..";
import { html } from "hono/html";
import { generateFilename } from "../util/filename";
import mime from "mime";

const app = new Hono<{ Bindings: Bindings }>();

app.post("/", async (c) => {
  const formdata = await c.req.formData();
  const urlString = formdata.get("url");

  let filename = generateFilename();

  if (urlString === null) {
    return c.html(
      Layout({
        content: html`<span class="error">input must include url</span>`,
      }),
      400
    );
  }

  const url = new URL(urlString.toString());

  const resp = await fetch(url);

  if (!resp.ok) {
    return c.html(
      Layout({
        content: html`<span class="error"
          >your url returned a non-ok status code: ${resp.status}</span
        >`,
      }),
      422
    );
  }

  const contentType = resp.headers.get("Content-Type");

  const extension =
    (contentType && mime.getExtension(contentType)) ||
    url.pathname.split(".").pop(); // fallback to extension in url (FIXME: security?)

  console.log({ contentType, extension, url });
  if (extension) filename += "." + extension;

  await c.env.R2_BUCKET.put(filename, resp.body, {
    httpMetadata: {
      contentType: contentType?.toString(),
    },
  });

  const objectUrl = c.env.PUBLIC_BUCKET_URL + "/" + filename;

  return c.html(
    Layout({
      content: html`<span
        >Your file is available here:
        <a href="${objectUrl}">${objectUrl}</a></span
      >`,
    })
  );
});

export default app;
