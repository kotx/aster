import mime from "mime";

const generateFilename = () => (Math.random() + 1).toString(36).substring(5);

export const generateFilenameWithExtension = (
  contentType: string | null,
  filenameLike: string | null // url pathname or original filename
) => {
  const filename = generateFilename();
  // derive an extension from the content type
  if (contentType) return filename + "." + mime.getExtension(contentType);
  // fallback to original extension (FIXME: security?)
  if (filenameLike) return filename + "." + filenameLike.split(".").pop();
  return filename;
};
