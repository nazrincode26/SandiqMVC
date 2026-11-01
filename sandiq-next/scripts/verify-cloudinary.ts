// Checks the Cloudinary settings in .env.local end to end with the app's own code:
// signs an upload, uploads a 1×1 PNG the way the browser does, verifies it like
// the listing actions do, then deletes it. Prints no credentials.
//   node --conditions=react-server --env-file=.env.local scripts/verify-cloudinary.ts
import {
  createUploadTicket,
  deliveryUrl,
  destroyImage,
  fetchImageResources,
  readCloudinaryConfig,
  resourceProblem,
} from "../lib/cloudinary.ts";

const base = readCloudinaryConfig();
if (!base) {
  console.error("Cloudinary is not configured (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET).");
  process.exit(1);
}
const config = { ...base, folder: "sandiq-verify/listings" };
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

const ticket = createUploadTicket(config, "verify-user", 1);
const slot = ticket.slots[0];
const form = new FormData();
form.append("file", new Blob([png], { type: "image/png" }), "verify.png");
form.append("api_key", ticket.apiKey);
form.append("timestamp", String(slot.timestamp));
form.append("public_id", slot.publicId);
for (const [k, v] of Object.entries(ticket.fields)) form.append(k, v);
form.append("signature", slot.signature);

const upload = await fetch(ticket.uploadUrl, { method: "POST", body: form });
const body = (await upload.json()) as { public_id?: string; error?: { message: string } };
if (!upload.ok) {
  console.error(`Signed upload failed (HTTP ${upload.status}): ${body.error?.message ?? "unknown error"}`);
  process.exit(1);
}
console.log(`signed upload: ok (${body.public_id === slot.publicId ? "public ID as signed" : "UNEXPECTED public ID"})`);

const found = (await fetchImageResources(config, [slot.publicId])).get(slot.publicId);
console.log(`server check: ${resourceProblem(found) ?? "ok"}`);
if (found) {
  const res = await fetch(deliveryUrl(config, found));
  console.log(`delivery URL: HTTP ${res.status} ${res.headers.get("content-type") ?? ""}`);
}
console.log(`cleanup: ${(await destroyImage(config, slot.publicId)) ? "test image deleted" : "delete failed"}`);
