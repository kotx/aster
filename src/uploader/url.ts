import { Hono } from "hono";
import { Bindings } from "../bindings";
import { Layout } from "..";
import { html } from "hono/html";
import { generateFilenameWithExtension } from "../util/filename";

const app = new Hono<{ Bindings: Bindings }>();

app.post("/", async (c) => {
  const formdata = await c.req.formData();
  const urlString = formdata.get("url");

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
  const filename = generateFilenameWithExtension(contentType, url.pathname);

  await c.env.R2_BUCKET.put(filename, resp.body, {
    httpMetadata: {
      contentType: contentType?.toString(),
    },
    customMetadata: {
      uploader: "aster",
      "source-ray": c.req.header("cf-ray")!,
      "source-url": url.toString(),
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
