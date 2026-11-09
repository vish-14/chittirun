import manifest from "./art/asset-manifest.json";

/** Base URL for static game assets. Point NEXT_PUBLIC_ASSET_BASE_URL at the CloudFront/S3 origin in AWS. */
export const ASSET_BASE = (process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "").replace(/\/$/, "");

export function assetUrl(file: string): string {
  return `${ASSET_BASE}/assets/sprites/${file}`;
}

export function atlasUrls(key: string) {
  const a = (manifest.atlases as Record<string, { png: string; json: string }>)[key];
  return a ? { png: assetUrl(a.png), json: assetUrl(a.json) } : null;
}
