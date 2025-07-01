// import { blake2b } from "@noble/hashes/blake2b";
import { toSerializedSignatureB64, SerializedSignature, Keypair } from "_src/xdag/typescript/cryptography";
import type { } from "_src/xdag/typescript/cryptography";
import { fromB64, fromHEX, toB64, toHEX } from "_src/xdag/bcs";

export class AccountKeypair {

	#keypair: Keypair;

	constructor(keypair: Keypair) {
		this.#keypair = keypair;
	}

	async sign(data: string): Promise<SerializedSignature> {
		// const digest = blake2b( data, { dkLen: 32 } );
		const pubkey = this.#keypair.getPublicKey();
		console.error("data in AccountKeypair:\n", data);
		const signature = this.#keypair.signData(fromHEX(data));
		console.error("sign in AccountKeypair:\n", toHEX(signature));
		const signatureScheme = this.#keypair.getKeyScheme();
		return toSerializedSignatureB64({
			signature,
			signatureScheme,
			pubKey: pubkey,
		});
	}


	exportKeypair() {
		return this.#keypair.export();
	}

	get publicKey() {
		return this.#keypair.getPublicKey();
	}
}
