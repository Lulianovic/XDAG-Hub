import { nullable, number, object, string } from "superstruct";
import type { Infer } from "superstruct";
import BigNumber from "bignumber.js";
import { type CoinStruct, ObjectId } from "../types";
export const XDAG_SYSTEM_ADDRESS = "0x3";
export const XDAG_FRAMEWORK_ADDRESS = "0x2";
export const XDAG_TYPE_ARG = `0x2::Xdag::XDAG`;
export const GAS_TYPE_ARG = "0x2::xdag::XDAG";
export const GAS_SYMBOL = "XDAG";
const COIN_TYPE = "0x2::coin::Coin";

export const CoinMetadataStruct = object({
  decimals: number(),
  name: string(),
  symbol: string(),
  description: string(),
  iconUrl: nullable(string()),
  id: nullable(ObjectId),
});
export type CoinMetadata = Infer<typeof CoinMetadataStruct>;

export class CoinAPI {

  static getCoinSymbol(coinTypeArg: string) {
    return coinTypeArg.substring(coinTypeArg.lastIndexOf(":") + 1);
  }

  static totalBalance(coins: CoinStruct[]): BigNumber {
    let total = coins.reduce((partialSum, c) => partialSum.plus(CoinAPI.getBalanceFromCoinStruct(c)), BigNumber(0),);
    return total;
  }

  static getBalanceFromCoinStruct(coin: CoinStruct): BigNumber {
    return BigNumber(coin.balance);
  }

  public static getCoinTypeFromArg(coinTypeArg: string) {
    return `${COIN_TYPE}<${coinTypeArg}>`;
  }
}

