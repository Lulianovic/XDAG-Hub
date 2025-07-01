import { toB64 } from "xdag/bcs";
import type { PublicKey } from "./publickey";
import { fromB64 } from "xdag/bcs";
import { Ed25519PublicKey } from "../keypairs/ed25519/publickey";
import { Secp256k1PublicKey } from "../keypairs/secp256k1/publickey";
import { Secp256r1PublicKey } from "../keypairs/secp256r1/publickey";

export type SignatureScheme =
	| "ED25519"
	| "Secp256k1"
	| "Secp256r1"
	| "MultiSig"
	| "Bip32"


// /**
//  * Pair of signature and corresponding public key
//  */
export type SignaturePubkeyPair = {
	signatureScheme: SignatureScheme;
	/** Base64-encoded signature */
	signature: Uint8Array;
	/** Base64-encoded public key */
	pubKey: PublicKey;
};

// /**
//  * (`flag || signature || pubkey` bytes, as base-64 encoded string).
//  * Signature is committed to the intent message of the transaction data, as base-64 encoded string.
//  */
export type SerializedSignature = string;

export const SIGNATURE_SCHEME_TO_FLAG = {
	ED25519: 0x00,
	Secp256k1: 0x01,
	Secp256r1: 0x02,
	MultiSig: 0x03,
	Bip32: 0x04
};

export const SIGNATURE_FLAG_TO_SCHEME = {
	0x00: "ED25519",
	0x01: "Secp256k1",
	0x02: "Secp256r1",
	0x03: "MultiSig",
} as const;

export type SignatureFlag = keyof typeof SIGNATURE_FLAG_TO_SCHEME;

export function toSerializedSignatureB64( { signature, signatureScheme, pubKey, }: SignaturePubkeyPair ): SerializedSignature {
	const pubKeyBytes = pubKey.toBytes();
	const serializedSignature = new Uint8Array( 1 + signature.length + pubKeyBytes.length );
	serializedSignature.set( [ SIGNATURE_SCHEME_TO_FLAG[ signatureScheme ] ] );
	serializedSignature.set( signature, 1 );
	serializedSignature.set( pubKeyBytes, 1 + signature.length );
	return toB64( serializedSignature );
}

/**
 * 从序列化签名字符串中解析出签名数据
 * @param serializedSignature Base64编码的序列化签名字符串
 * @returns 解析后的签名数据
 */
export function fromSerializedSignature(serializedSignature: SerializedSignature): SignaturePubkeyPair {
	// 1. 从Base64解码
	const bytes = fromB64(serializedSignature);
	if (bytes.length < 1) {
		throw new Error("Invalid serialized signature: too short");
	}
	// 2. 解析签名方案标志
	const flag = bytes[0] as SignatureFlag;
	const signatureScheme = SIGNATURE_FLAG_TO_SCHEME[flag];
	if (!signatureScheme) {
		throw new Error(`Unknown signature scheme flag: ${flag}`);
	}
	// 3. 根据签名方案确定签名和公钥的长度
	let signatureLength: number;
	let pubKeyLength: number;
	switch (signatureScheme) {
		case "ED25519":
			signatureLength = 64; // Ed25519签名长度
			pubKeyLength = 32;    // Ed25519公钥长度
			break;
		case "Secp256k1":
			signatureLength = 64; // Secp256k1签名长度
			pubKeyLength = 33;    // Secp256k1公钥长度（压缩格式）
			break;
		case "Secp256r1":
			signatureLength = 64; // Secp256r1签名长度
			pubKeyLength = 33;    // Secp256r1公钥长度（压缩格式）
			break;
		default:
			throw new Error(`Unsupported signature scheme: ${signatureScheme}`);
	}
	// 4. 验证总长度
	const expectedLength = 1 + signatureLength + pubKeyLength;
	if (bytes.length !== expectedLength) {
		throw new Error(
			`Invalid serialized signature length. Expected ${expectedLength}, got ${bytes.length}`
		);
	}
	// 5. 提取签名和公钥字节
	const signature = bytes.slice(1, 1 + signatureLength);
	const pubKeyBytes = bytes.slice(1 + signatureLength);
	// 6. 创建对应的公钥对象
	let pubKey: PublicKey;
	switch (signatureScheme) {
		case "ED25519":
			pubKey = new Ed25519PublicKey(pubKeyBytes);
			break;
		case "Secp256k1":
			pubKey = new Secp256k1PublicKey(pubKeyBytes);
			break;
		case "Secp256r1":
			pubKey = new Secp256r1PublicKey(pubKeyBytes);
			break;
		default:
			throw new Error(`Unsupported signature scheme: ${signatureScheme}`);
	}
	return {
		signatureScheme,
		signature,
		pubKey,
	};
}

/**
 * 从序列化签名中仅提取签名字节
 * @param serializedSignature Base64编码的序列化签名字符串
 * @returns 签名字节数组
 */
export function extractSignatureBytes(serializedSignature: SerializedSignature): Uint8Array {
	const { signature } = fromSerializedSignature(serializedSignature);
	return signature;
}

/**
 * 从序列化签名中仅提取公钥
 * @param serializedSignature Base64编码的序列化签名字符串
 * @returns 公钥对象
 */
export function extractPublicKey(serializedSignature: SerializedSignature): PublicKey {
	const { pubKey } = fromSerializedSignature(serializedSignature);
	return pubKey;
}

/**
 * 从序列化签名中仅提取签名方案
 * @param serializedSignature Base64编码的序列化签名字符串
 * @returns 签名方案
 */
export function extractSignatureScheme(serializedSignature: SerializedSignature): SignatureScheme {
	const { signatureScheme } = fromSerializedSignature(serializedSignature);
	return signatureScheme;
}
