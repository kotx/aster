import { Hono } from "hono";
import { html } from "hono/html";
import { serveStatic } from "hono/cloudflare-workers";
import { logger } from "hono/logger";
import uppy from "./uploader/uppy";
import url from "./uploader/url";
import { Bindings } from "./bindings";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());

interface LayoutProps {
  head?: string;
  scripts?: string;
  content: string;
}

export const Layout = ({
  content: main,
  head,
  scripts,
}: LayoutProps) => html`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Aster</title>
      <link rel="stylesheet" href="/style.css" />
      ${head}
    </head>
    <body>
      <h1><a href="/">Aster</a></h1>
      <p>Robust R2 file uploader.</p>
      <main>${main}</main>
      ${scripts}
    </body>
  </html>`;

app.get("/", (c) =>
  c.html(
    Layout({
      head: html`<link rel="stylesheet" href="/dist/index.css" />`,
      scripts: html`<script src="/dist/index.js"></script>`,
      content: html` <p>Upload your file here:</p>
        <form action="/url" method="post" enctype="multipart/form-data">
          <input type="url" name="url" required />
          <input type="submit" value="Upload URL" name="submit" />
        </form>
        <p>OR</p>
        <output id="uppy"></output>`,
    })
  )
);

app.use("/dist/sw.js", async (c, next) => {
  await next();
  c.header("Service-Worker-Allowed", "/");
});

app.route("/url", url);
app.route("/uppy", uppy);

app.get("*", serveStatic());

export default app;
