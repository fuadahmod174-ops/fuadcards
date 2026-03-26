const WORKER_URL = import.meta.env.VITE_WORKER_URL || "https://fuadcards.selectedlegendbusiness.workers.dev";
const AUTH_KEY = import.meta.env.VITE_WORKER_AUTH_KEY || "123456@";

export async function uploadToR2(fileName: string, dataUrl: string) {
  // Convert Data URL to Blob
  const res = await fetch(dataUrl);
  const blob = await res.blob();

  // Use the worker URL to upload directly
  const response = await fetch(`${WORKER_URL}?file=${fileName}`, {
    method: 'POST',
    headers: {
      'Authorization': AUTH_KEY,
      'Content-Type': 'image/png'
    },
    body: blob
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload to R2: ${errorText}`);
  }

  // Return the URL to access the file via the worker
  return `${WORKER_URL}/${fileName}`;
}

export async function deleteFromR2(fileName: string) {
  const response = await fetch(`${WORKER_URL}?file=${fileName}`, {
    method: 'DELETE',
    headers: {
      'Authorization': AUTH_KEY
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete from R2: ${errorText}`);
  }

  return true;
}
