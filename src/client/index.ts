import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import GoldenRetriever from "@uppy/golden-retriever";
import S3 from "@uppy/aws-s3";

import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

const uppy = new Uppy()
  .use(Dashboard, { inline: true, target: "#uppy", showProgressDetails: true })
  .use(GoldenRetriever, { serviceWorker: true })
  .use(S3, {
    // Only use multipart uploads for files larger than 100 MB.
    shouldUseMultipart: (file) => file.size > 100 * 2 ** 20,
    // async createMultipartUpload(file) {},
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
