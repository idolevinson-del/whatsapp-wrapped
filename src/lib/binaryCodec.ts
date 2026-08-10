/**
 * Minimal binary read/write helpers — LEB128 varints (correct up to
 * Number.MAX_SAFE_INTEGER, since epoch-ms timestamps don't fit in 32 bits)
 * and length-prefixed UTF-8 strings. Used to pack the share-link payload far
 * denser than JSON does, since every byte here ends up as visible text in a
 * WhatsApp message.
 */

export class BinaryWriter {
  private bytes: number[] = [];

  writeUint8(byte: number): void {
    this.bytes.push(byte & 0xff);
  }

  /** Unsigned LEB128 — only ever called with non-negative integers here. */
  writeVarint(value: number): void {
    let n = Math.max(0, Math.floor(value));
    while (n >= 0x80) {
      this.writeUint8((n % 128) | 0x80);
      n = Math.floor(n / 128);
    }
    this.writeUint8(n);
  }

  writeString(value: string): void {
    const utf8 = new TextEncoder().encode(value);
    this.writeVarint(utf8.length);
    for (const byte of utf8) this.bytes.push(byte);
  }

  build(): Uint8Array {
    return new Uint8Array(this.bytes);
  }
}

export class BinaryReader {
  private pos = 0;
  private view: Uint8Array;

  constructor(view: Uint8Array) {
    this.view = view;
  }

  get hasMore(): boolean {
    return this.pos < this.view.length;
  }

  readUint8(): number {
    return this.view[this.pos++];
  }

  readVarint(): number {
    let result = 0;
    let multiplier = 1;
    let byte: number;
    do {
      byte = this.readUint8();
      result += (byte & 0x7f) * multiplier;
      multiplier *= 128;
    } while (byte & 0x80);
    return result;
  }

  readString(): string {
    const length = this.readVarint();
    const slice = this.view.subarray(this.pos, this.pos + length);
    this.pos += length;
    return new TextDecoder().decode(slice);
  }
}
