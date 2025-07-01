

export function base64EncodeJson(srcObj: {}): string {
    const jsonString = JSON.stringify(srcObj);
    const resultString = base64Encode(jsonString);
    return resultString;
}

export function base64DecodeJson(base46Str: string): {} {
    const backString = base64Decode(base46Str);
    const obj1 = JSON.parse(backString);
    return obj1;
}

export function base64Encode(str: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    let binary = '';
    const len = data.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
}

export function base64Decode(str: string) {
    const binary = atob(str);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
}
