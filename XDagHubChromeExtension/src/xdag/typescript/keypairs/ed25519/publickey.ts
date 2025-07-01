
import {
  PublicKey,
  PublicKeyInitData
} from "../../cryptography";
import { fromB64 } from "_src/xdag/bcs";

const PUBLIC_KEY_SIZE = 32;
/**
 * An Ed25519 public key
 */
export class Ed25519PublicKey extends PublicKey {
  static SIZE = PUBLIC_KEY_SIZE;
  private data: Uint8Array;

  constructor(value: PublicKeyInitData) {
    super();

    if (typeof value === "string") {
      this.data = fromB64(value);
    } else if (value instanceof Uint8Array) {
      this.data = value;
    } else {
      this.data = Uint8Array.from(value);
    }

    if (this.data.length !== PUBLIC_KEY_SIZE) {
      throw new Error(
        `Invalid public key input. Expected ${PUBLIC_KEY_SIZE} bytes, got ${this.data.length}`,
      );
    }
  }
  override equals(publicKey: Ed25519PublicKey): boolean {
    return super.equals(publicKey);
  }

  toBytes(): Uint8Array {
    return this.data;
  }


  toXDagAddress(): string {
    return "";
  }

}
