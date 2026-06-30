const IMAGE_SIGNATURES: { mime: string; bytes: number[] }[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

const DIGITAL_ALLOWED = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/epub+zip",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

async function readHeader(file: File, len = 12): Promise<Uint8Array> {
  const slice = file.slice(0, len);
  const buf = await slice.arrayBuffer();
  return new Uint8Array(buf);
}

function matchesSignature(header: Uint8Array, sig: number[]): boolean {
  return sig.every((b, i) => header[i] === b);
}

export async function validateImageFile(file: File): Promise<string | null> {
  if (file.size > 5 * 1024 * 1024) return `${file.name}: max 5 MB`;
  const header = await readHeader(file);
  const match = IMAGE_SIGNATURES.find((s) => matchesSignature(header, s.bytes));
  if (!match) return `${file.name}: not a valid image (JPEG, PNG, GIF, WebP only)`;
  if (match.mime === "image/webp" && header.length >= 12) {
    const riff = String.fromCharCode(...header.slice(8, 12));
    if (riff !== "WEBP") return `${file.name}: invalid WebP`;
  }
  return null;
}

export function validateDigitalFile(file: File): string | null {
  if (file.size > 100 * 1024 * 1024) return `${file.name}: max 100 MB`;
  if (!DIGITAL_ALLOWED.has(file.type)) {
    return `${file.name}: type not allowed (PDF, ZIP, EPUB, or image only)`;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  const blocked = ["exe", "php", "js", "html", "bat", "cmd", "sh", "msi", "dll"];
  if (ext && blocked.includes(ext)) return `${file.name}: file type blocked`;
  return null;
}
