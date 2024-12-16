function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function convertArrayBuffersToBase64<T>(
  object: Record<string, T>,
): Record<string, unknown> {
  const convertedObject: Record<string, unknown> = {};
  for (const key in object) {
    const value = object[key];
    if (value instanceof ArrayBuffer) {
      convertedObject[key] = arrayBufferToBase64(value);
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      convertedObject[key] = convertArrayBuffersToBase64(
        value as Record<string, string | T>,
      );
    } else if (typeof value === "function") {
      // Do nothing
    } else {
      convertedObject[key] = value;
    }
  }
  return convertedObject;
}
