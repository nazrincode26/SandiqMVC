// Unit tests for lib/cloudinary.ts (signing, ownership checks, validation and
// the REST calls, with fetch mocked — no Cloudinary account needed).
// Run with: npm test
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  ALLOWED_FORMATS,
  MAX_IMAGE_BYTES,
  createUploadTicket,
  deliveryUrl,
  destroyImage,
  fetchImageResources,
  isManagedPublicId,
  isOwnPublicId,
  readCloudinaryConfig,
  resourceProblem,
  signParams,
  type CloudinaryConfig,
} from "../lib/cloudinary.ts";

const config: CloudinaryConfig = {
  cloudName: "demo-cloud",
  apiKey: "123456789012345",
  apiSecret: "test-secret",
  folder: "sandiq/listings",
  algorithm: "sha1",
};
const UID = "AbC123_uid-x";
const ID = `sandiq/listings/${UID}/0b9a8f7e-1d2c-4b3a-9f8e-7d6c5b4a3f21`;

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("readCloudinaryConfig", () => {
  it("returns null when any credential is missing", () => {
    assert.equal(readCloudinaryConfig({ CLOUDINARY_CLOUD_NAME: "a", CLOUDINARY_API_KEY: "1" } as unknown as NodeJS.ProcessEnv), null);
    assert.equal(readCloudinaryConfig({} as unknown as NodeJS.ProcessEnv), null);
  });

  it("reads the server-only variables with defaults", () => {
    const c = readCloudinaryConfig({ CLOUDINARY_CLOUD_NAME: "cloud", CLOUDINARY_API_KEY: "42", CLOUDINARY_API_SECRET: "s" } as unknown as NodeJS.ProcessEnv);
    assert.deepEqual(c, { cloudName: "cloud", apiKey: "42", apiSecret: "s", folder: "sandiq/listings", algorithm: "sha1" });
  });

  it("rejects unsafe folder and cloud names", () => {
    const base = { CLOUDINARY_CLOUD_NAME: "cloud", CLOUDINARY_API_KEY: "42", CLOUDINARY_API_SECRET: "s" };
    assert.equal(readCloudinaryConfig({ ...base, CLOUDINARY_UPLOAD_FOLDER: "../x" } as unknown as NodeJS.ProcessEnv), null);
    assert.equal(readCloudinaryConfig({ ...base, CLOUDINARY_CLOUD_NAME: "a/b" } as unknown as NodeJS.ProcessEnv), null);
    assert.equal(readCloudinaryConfig({ ...base, CLOUDINARY_UPLOAD_FOLDER: "/sandiq-dev/listings/" } as unknown as NodeJS.ProcessEnv)?.folder, "sandiq-dev/listings");
  });
});

describe("signParams", () => {
  it("matches Cloudinary's documented example", () => {
    // https://cloudinary.com/documentation/authentication_signatures
    const sig = signParams({ eager: "w_400,h_300,c_pad|w_260,h_200,c_crop", public_id: "sample_image", timestamp: 1315060510 }, "abcd");
    assert.equal(sig, "bfd09f95f331f558cbd1320e67aa8d488770583e");
  });

  it("sorts keys and skips empty values", () => {
    const expected = createHash("sha1").update("a=1&b=2" + "s").digest("hex");
    assert.equal(signParams({ b: 2, a: 1, c: "" }, "s"), expected);
  });

  it("supports sha256 accounts", () => {
    assert.equal(signParams({ a: 1 }, "s", "sha256"), createHash("sha256").update("a=1s").digest("hex"));
  });
});

describe("createUploadTicket", () => {
  it("signs one slot per image inside the user's folder", () => {
    const ticket = createUploadTicket(config, UID, 3, 1_700_000_000_000);
    assert.equal(ticket.slots.length, 3);
    assert.equal(ticket.uploadUrl, "https://api.cloudinary.com/v1_1/demo-cloud/image/upload");
    assert.equal(ticket.maxBytes, MAX_IMAGE_BYTES);
    assert.equal(new Set(ticket.slots.map((s) => s.publicId)).size, 3);
    for (const slot of ticket.slots) {
      assert.ok(isOwnPublicId(config, UID, slot.publicId), slot.publicId);
      assert.equal(slot.timestamp, 1_700_000_000);
      const expected = signParams({ ...ticket.fields, public_id: slot.publicId, timestamp: slot.timestamp }, config.apiSecret);
      assert.equal(slot.signature, expected);
    }
    assert.equal(ticket.fields.overwrite, "false");
    assert.equal(ticket.fields.allowed_formats, ALLOWED_FORMATS.join(","));
  });

  it("never sends the API secret to the browser", () => {
    const ticket = createUploadTicket(config, UID, 1);
    assert.ok(!JSON.stringify(ticket).includes(config.apiSecret));
  });

  it("refuses odd user ids", () => {
    assert.throws(() => createUploadTicket(config, "../other", 1));
  });
});

describe("public ID ownership", () => {
  it("accepts only IDs issued for this user", () => {
    assert.ok(isOwnPublicId(config, UID, ID));
    assert.ok(!isOwnPublicId(config, "someoneElse", ID));
    assert.ok(!isOwnPublicId(config, UID, `${ID}/x`));
    assert.ok(!isOwnPublicId(config, UID, "sandiq/listings/AbC123_uid-x/not-a-uuid"));
    assert.ok(!isOwnPublicId(config, UID, "/uploads/products/0e3a9316-b43b-4232-a5f8-1ab769a3d840.jpg"));
  });

  it("treats only the app folder as deletable", () => {
    assert.ok(isManagedPublicId(config, ID));
    assert.ok(!isManagedPublicId(config, "samples/landscapes/beach"));
    assert.ok(!isManagedPublicId(config, "/uploads/products/0e3a9316-b43b-4232-a5f8-1ab769a3d840.jpg"));
  });
});

describe("resourceProblem", () => {
  const ok = { public_id: ID, version: 1712345678, format: "jpg", resource_type: "image", type: "upload", bytes: 2048 };
  it("accepts a normal image", () => assert.equal(resourceProblem(ok), null));
  it("rejects missing, oversized, wrong-type and wrong-format assets", () => {
    assert.equal(resourceProblem(undefined), "missing");
    assert.equal(resourceProblem({ ...ok, bytes: MAX_IMAGE_BYTES + 1 }), "too large");
    assert.equal(resourceProblem({ ...ok, bytes: 0 }), "too large");
    assert.equal(resourceProblem({ ...ok, resource_type: "raw" }), "not an uploaded image");
    assert.equal(resourceProblem({ ...ok, type: "private" }), "not an uploaded image");
    assert.equal(resourceProblem({ ...ok, format: "svg" }), "format not allowed");
    assert.equal(resourceProblem({ ...ok, format: "pdf" }), "format not allowed");
  });
});

describe("deliveryUrl", () => {
  it("builds an optimised, versioned HTTPS URL", () => {
    assert.equal(
      deliveryUrl(config, { public_id: ID, version: 1712345678 }),
      `https://res.cloudinary.com/demo-cloud/image/upload/c_limit,w_1600,f_auto,q_auto/v1712345678/${ID}`
    );
  });
});

describe("REST calls", () => {
  it("looks up resources with Basic auth and maps them by public ID", async () => {
    let seen: { url: string; auth: string | null } | undefined;
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      seen = { url, auth: new Headers(init?.headers).get("authorization") };
      return Response.json({ resources: [{ public_id: ID, version: 1, format: "png", resource_type: "image", type: "upload", bytes: 10 }] });
    }) as typeof fetch;
    const map = await fetchImageResources(config, [ID]);
    assert.equal(map.get(ID)?.format, "png");
    assert.ok(seen!.url.startsWith("https://api.cloudinary.com/v1_1/demo-cloud/resources/image/upload?"));
    assert.equal(new URL(seen!.url).searchParams.getAll("public_ids[]")[0], ID);
    assert.equal(seen!.auth, "Basic " + Buffer.from("123456789012345:test-secret").toString("base64"));
    assert.ok(!seen!.url.includes("test-secret"));
  });

  it("throws when the lookup fails", async () => {
    globalThis.fetch = (async () => new Response("nope", { status: 500 })) as typeof fetch;
    await assert.rejects(fetchImageResources(config, [ID]), /HTTP 500/);
  });

  it("signs destroy requests and accepts ok / not found", async () => {
    let body: URLSearchParams | undefined;
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      body = init?.body as URLSearchParams;
      return Response.json({ result: "ok" });
    }) as typeof fetch;
    assert.equal(await destroyImage(config, ID, 1_700_000_000_000), true);
    assert.equal(body!.get("public_id"), ID);
    assert.equal(body!.get("signature"), signParams({ invalidate: "true", public_id: ID, timestamp: 1_700_000_000 }, config.apiSecret));
    assert.equal(body!.get("api_secret"), null);

    globalThis.fetch = (async () => Response.json({ result: "not found" })) as typeof fetch;
    assert.equal(await destroyImage(config, ID), true);
    globalThis.fetch = (async () => Response.json({ error: { message: "x" } }, { status: 401 })) as typeof fetch;
    assert.equal(await destroyImage(config, ID), false);
  });
});
