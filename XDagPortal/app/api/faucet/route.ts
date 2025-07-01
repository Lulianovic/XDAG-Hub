import { NextRequest, NextResponse } from 'next/server'
import { TransactionHelper } from 'xdag/typescript/builder';
import { JsonRpcProvider } from 'xdag/typescript/rpc/json-rpc-provider';
import { API_ENV } from 'xdag/shared/api-env';
import { Connection } from 'xdag/typescript/rpc';
import { fromHEX } from 'xdag/bcs';
import { Secp256k1Keypair, } from 'xdag/typescript/keypairs';

// 模拟数据库存储（生产环境建议使用真实数据库）
const dailyRequests = new Map<string, { count: number; lastReset: string }>()

// XDAG水龙头配置
const FAUCET_CONFIG = {
  DAILY_LIMIT: 2, // 每日限制2个XDAG
  AMOUNT_PER_REQUEST: 1, // 每次申请1个XDAG
  FACET_ENV: API_ENV.testNet,
  TESTNET_RPC_URL: process.env.API_ENDPOINT_TEST_NET_FULLNODE,
  FAUCET_PRIVATE_KEY: process.env.FAUCET_PRIVATE_KEY || '',
}

// 检查是否是新的一天
function isNewDay(lastReset: string): boolean {
  const today = new Date().toDateString()
  return lastReset !== today
}

// 获取客户端IP地址  // 尝试多种方式获取真实 IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip') // Cloudflare
  const xClientIP = request.headers.get('x-client-ip')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  if (xClientIP) {
    return xClientIP
  }
  return request.ip || 'unknown'
}

// 验证XDAG地址格式
function isValidXDAGAddress(address: string): boolean {
  // XDAG地址通常是64个字符的十六进制字符串
  const xdagAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{33}$/;
  return xdagAddressRegex.test(address)
}

// 发送XDAG到指定地址（模拟实现）
async function sendXDAG(toAddress: string, amount: number): Promise<{
  success: boolean;
  txHash?: string;
  address?: string;
  state?: string;
  blockTime?: number;
  remark?: string;
  error?: string;
}> {
  try {

    // 创建RPC提供者实例
    const faucetConnecting = new Connection({ fullnode: FAUCET_CONFIG.TESTNET_RPC_URL ?? "" });
    const rpcProvider = new JsonRpcProvider(faucetConnecting);

    const secretKeyData = fromHEX(FAUCET_CONFIG.FAUCET_PRIVATE_KEY)
    const faucetKeypair: Secp256k1Keypair = Secp256k1Keypair.fromSecretKey(secretKeyData)
    const faucetPublicKey = faucetKeypair.getPublicKey();
    const faucetAddress = faucetPublicKey.toXDagAddress();
    const faucetPubKeyB64 = faucetPublicKey.toBase64();

    // 获取发送者地址的nonce
    const nonce = await rpcProvider.getNonce(faucetAddress);

    // 实际实现时，这里应该调用XDAG的转账API
    const txInfo = {
      sender: faucetAddress,
      to: toAddress,
      amount: amount.toString(),
      remark: "faucet",
      nonce: nonce,
      senderPublicKey: faucetPubKeyB64,
      networkEnv: FAUCET_CONFIG.FACET_ENV
    };
    console.log("txInfo:", txInfo);
    const tx = TransactionHelper.createTransactionBlock(txInfo);
    const h = await tx.buildPart() ?? "";

    const txSigned = faucetKeypair.signData(fromHEX(h));
    const signData = await tx.buildFinally(txSigned);
    const response = await rpcProvider.executeSendRawTransaction(tx, signData);

    // 判断是否成功
    if (response.state === "Pending" && response.address && response.hash) {
      // 成功情况
      return {
        success: true,
        txHash: response.hash,
        address: response.address,
        state: response.state,
        blockTime: response.blockTime,
        remark: response.remark
      }
    } else {
      // 失败情况
      return {
        success: false,
        error: response.errorInfo || `Transaction failed with state: ${response.state}`
      }
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address } = body
    
    // 验证请求参数
    if (!address) {
      return NextResponse.json(
        { error: '请提供XDAG地址' },
        { status: 400 }
      )
    }
    if (!isValidXDAGAddress(address)) {
      return NextResponse.json(
        { error: '无效的XDAG地址格式' },
        { status: 400 }
      )
    }
    
    // 获取客户端标识
    const clientIP = getClientIP(request)
    const ipKey = `ip_${clientIP}`
    const addressKey = `addr_${address}`
    const today = new Date().toDateString()
    
    // 检查IP限制
    const ipRequests = dailyRequests.get(ipKey)
    if (ipRequests) {
      if (isNewDay(ipRequests.lastReset)) {
        // 新的一天，重置计数
        dailyRequests.set(ipKey, { count: 0, lastReset: today })
      } else if (ipRequests.count >= FAUCET_CONFIG.DAILY_LIMIT) {
        return NextResponse.json(
          {
            error: `该IP今天已申请了 ${ipRequests.count} 次，明天再来吧！`,
            remainingRequests: 0
          },
          { status: 429 }
        )
      }
    } else {
      // 首次请求
      dailyRequests.set(ipKey, { count: 0, lastReset: today })
    }
    
    // 检查地址限制
    const addressRequests = dailyRequests.get(addressKey)
    if (addressRequests) {
      if (isNewDay(addressRequests.lastReset)) {
        // 新的一天，重置计数
        dailyRequests.set(addressKey, { count: 0, lastReset: today })
      } else if (addressRequests.count >= FAUCET_CONFIG.DAILY_LIMIT) {
        return NextResponse.json(
          {
            error: `该地址今天已申请了 ${addressRequests.count} 次，明天再来吧！`,
            remainingRequests: 0
          },
          { status: 429 }
        )
      }
    } else {
      // 首次请求
      dailyRequests.set(addressKey, { count: 0, lastReset: today })
    }
    
    // 发送XDAG
    const result = await sendXDAG(address, FAUCET_CONFIG.AMOUNT_PER_REQUEST)
    if (!result.success) {
      return NextResponse.json(
        { error: `转账失败: ${result.error}` },
        { status: 500 }
      )
    }
    
    // 更新两个计数器
    const currentIpRequests = dailyRequests.get(ipKey)!
    const currentAddressRequests = dailyRequests.get(addressKey)!
    
    dailyRequests.set(ipKey, {
      count: currentIpRequests.count + 1,
      lastReset: today
    })
    dailyRequests.set(addressKey, {
      count: currentAddressRequests.count + 1,
      lastReset: today
    })
    
    // 计算剩余次数（取两者中的最小值）
    const ipRemaining = FAUCET_CONFIG.DAILY_LIMIT - (currentIpRequests.count + 1)
    const addressRemaining = FAUCET_CONFIG.DAILY_LIMIT - (currentAddressRequests.count + 1)
    const remainingRequests = Math.min(ipRemaining, addressRemaining)
    
    return NextResponse.json({
      success: true,
      message: `成功发送 ${FAUCET_CONFIG.AMOUNT_PER_REQUEST} XDAG 到您的地址`,
      txHash: result.txHash,
      amount: FAUCET_CONFIG.AMOUNT_PER_REQUEST,
      remainingRequests: remainingRequests,
      address: result.address
    })

  } catch (error) {
    console.error('Faucet API error:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 获取用户今日剩余申请次数
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address || !isValidXDAGAddress(address)) {
      return NextResponse.json(
        { error: '请提供有效的XDAG地址' },
        { status: 400 }
      )
    }

    const clientIP = getClientIP(request)
    const ipKey = `ip_${clientIP}`
    const addressKey = `addr_${address}`
    const today = new Date().toDateString()

    const ipRequests = dailyRequests.get(ipKey)
    const addressRequests = dailyRequests.get(addressKey)
    
    let ipRemaining = FAUCET_CONFIG.DAILY_LIMIT
    let addressRemaining = FAUCET_CONFIG.DAILY_LIMIT

    if (ipRequests && !isNewDay(ipRequests.lastReset)) {
      ipRemaining = FAUCET_CONFIG.DAILY_LIMIT - ipRequests.count
    }
    
    if (addressRequests && !isNewDay(addressRequests.lastReset)) {
      addressRemaining = FAUCET_CONFIG.DAILY_LIMIT - addressRequests.count
    }
    
    // 剩余次数取两者中的最小值
    const remainingRequests = Math.min(Math.max(0, ipRemaining), Math.max(0, addressRemaining))

    return NextResponse.json({
      remainingRequests: remainingRequests,
      dailyLimit: FAUCET_CONFIG.DAILY_LIMIT,
      amountPerRequest: FAUCET_CONFIG.AMOUNT_PER_REQUEST,
      ipRemaining: Math.max(0, ipRemaining),
      addressRemaining: Math.max(0, addressRemaining)
    })

  } catch (error) {
    console.error('Faucet status API error:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
