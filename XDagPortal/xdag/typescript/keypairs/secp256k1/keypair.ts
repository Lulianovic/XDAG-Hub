


import { secp256k1 } from "@noble/curves/secp256k1";
import { blake2b } from "@noble/hashes/blake2b";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";
import { HDKey } from "@scure/bip32";
import { Secp256k1PublicKey } from "./publickey";
import { Keypair } from "../../cryptography/keypair";
import { mnemonicToSeed, } from "../../cryptography/mnemonics";
import { fromHEX, toB64, toHEX } from "xdag/bcs";
import type { ExportedKeypair } from "../../cryptography/keypair";
import type { PublicKey } from "../../cryptography/publickey";
import type { SignatureScheme } from "../../cryptography/signature";


export const DEFAULT_SECP256K1_DERIVATION_PATH = "m/44'/586'/0'/0/0";

export interface Secp256k1KeypairData {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
}


export class Secp256k1Keypair extends Keypair {
    private keypair: Secp256k1KeypairData;


    constructor(keypair?: Secp256k1KeypairData) {
        super();
        if (keypair) {
            this.keypair = keypair;
        } else {
            const secretKey: Uint8Array = secp256k1.utils.randomPrivateKey();
            const publicKey: Uint8Array = secp256k1.getPublicKey(secretKey, true);
            this.keypair = { publicKey, secretKey };
        }
    }


    getKeyScheme(): SignatureScheme {
        return "Secp256k1";
    }


    static generate(): Secp256k1Keypair {
        return new Secp256k1Keypair();
    }

    static fromSecretKey(secretKey: Uint8Array, options?: { skipValidation?: boolean },): Secp256k1Keypair {
        const publicKey: Uint8Array = secp256k1.getPublicKey(secretKey, true);
        if (!options || !options.skipValidation) {
            const encoder = new TextEncoder();
            const signData = encoder.encode("xdag validation");
            const msgHash = toHEX(sha256(signData));
            const signature = secp256k1.sign(msgHash, secretKey);
            if (!secp256k1.verify(signature, msgHash, publicKey, { lowS: true })) {
                throw new Error("Provided secretKey is invalid");
            }
        }
        return new Secp256k1Keypair({ publicKey, secretKey });
    }


    //seed is private key
    static fromSeed(seed: Uint8Array): Secp256k1Keypair {
        let publicKey = secp256k1.getPublicKey(seed, true);
        return new Secp256k1Keypair({ publicKey, secretKey: seed });
    }


    getPublicKey(): PublicKey {
        return new Secp256k1PublicKey(this.keypair.publicKey);
    }


    async sign(data: Uint8Array) {
        return this.signData(data);
    }

    signData(data: Uint8Array): Uint8Array {
        const sig = secp256k1.sign(data, this.keypair.secretKey, { lowS: true, });
        const rb = sig.toCompactRawBytes();
        return rb;
    }

    static deriveKeypair(mnemonics: string, path?: string): Secp256k1Keypair {
        const key = HDKey.fromMasterSeed(mnemonicToSeed(mnemonics)).derive(path ?? DEFAULT_SECP256K1_DERIVATION_PATH);
        if (key.publicKey == null || key.privateKey == null) {
            throw new Error("Invalid key");
        }
        return new Secp256k1Keypair({
            publicKey: key.publicKey,
            secretKey: key.privateKey,
        });
    }

    export(): ExportedKeypair {
        return {
            schema: "Secp256k1",
            privateKey: toB64(this.keypair.secretKey),
        };
    }

}
