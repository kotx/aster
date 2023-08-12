import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import GoldenRetriever from "@uppy/golden-retriever";
import S3 from "@uppy/aws-s3";
import { ofetch } from "ofetch";

import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

new Uppy()
  .use(Dashboard, {
    inline: true,
    target: "output#uppy",
    showProgressDetails: true,
    showLinkToFileUploadResult: true,
  })
  .use(GoldenRetriever, { serviceWorker: true })
  .use(S3, {
    // Only use multipart uploads for files larger than 100 MB.
    shouldUseMultipart: true, // TODO: (file) => file.size > 100 * 2 ** 20,
    async getUploadParameters(file) {
      const res = await ofetch("/uppy/s3", {
        method: "POST",
        body: { file },
      });

      return res;
    },
    async createMultipartUpload(file) {
      const res = await ofetch("/uppy/s3-multipart", {
        method: "POST",
        body: { file },
      });

      return res;
    },
    async listParts(file, { uploadId, key }) {
      const res = await ofetch(
        `/uppy/s3-multipart/${encodeURIComponent(uploadId)}`,
        {
          body: { key },
        }
      );

      return res;
    },
    async signPart(file, { uploadId, key, partNumber, body, signal }) {
      const res = await ofetch(
        `/uppy/s3-multipart/${encodeURIComponent(
          uploadId
        )}/${encodeURIComponent(partNumber)}`,
        {
          method: "POST",
          body: { key },
          signal,
        }
      );

      return res;
    },
    async abortMultipartUpload(file, { uploadId, key, signal }) {
      await ofetch(`/uppy/s3-multipart/${encodeURIComponent(uploadId)}`, {
        method: "DELETE",
        body: { key },
        signal,
      });
    },
    async completeMultipartUpload(file, { uploadId, key, parts, signal }) {
      const res = await ofetch(
        `/uppy/s3-multipart/${encodeURIComponent(uploadId)}/complete`,
        {
          method: "POST",
          body: { key, parts },
          signal,
        }
      );

      return res;
    },
  });

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/dist/sw.js", {
      scope: "/",
    })
    .then((registration: ServiceWorkerRegistration) => {
      console.log(
        "Service worker registration successful with scope: ",
        registration.scope
      );
    })
    .catch((error) => {
      console.log(`Service worker registration failed with ${error}`);
    });
}
