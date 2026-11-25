export const downloadBlob = (blob, fileName) => {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke asynchronously to let the browser start the download first.
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
};
