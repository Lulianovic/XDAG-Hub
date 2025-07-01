import React, { useState, useEffect } from 'react';
import clsx from 'classnames';
import { useActiveAddress } from '_app/hooks/useActiveAddress';
import { Text } from '_app/shared/text';
import { LargeButton } from '_app/shared/LargeButton';
import { Card } from '_app/shared/card';
import { WalletActionBuy24, Copy12, CheckStroke16, Info16 } from '_assets/icons/tsIcons';
import { useTranslation } from 'react-i18next';
import Browser from "webextension-polyfill";
import axios from "axios";
import { AddressLink } from '_src/ui/app/components/AddressLink';

interface FaucetResponse {
  success: boolean;
  message?: string;
  txHash?: string;
  amount?: number;
  remainingRequests?: number;
  address?: string;
  error?: string;
}

interface FaucetStatus {
  remainingRequests: number;
  dailyLimit: number;
  amountPerRequest: number;
}

export default function FaucetComponent() {
  const activeAddress = useActiveAddress();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FaucetResponse | null>(null);
  const [status, setStatus] = useState<FaucetStatus | null>(null);
  const [addressError, setAddressError] = useState('');
  const [copied, setCopied] = useState(false);

  const xdagPortWebSite = process.env.XDAGP_PORT_WEBSITE;

  // 当钱包连接时自动填入地址
  useEffect(() => {
    if (activeAddress) {
      fetchStatus();
    }
  }, [activeAddress]);

  useEffect(() => {
    if (result?.address) {
      Browser.storage.local.set({ pendingBlockAddress: result.address })
    }
  }, [result])

  // 验证XDAG地址格式
  // 5Jqjo7Eprp2MJbnTxXoQZfHGPYTMDh7SR
  const validateAddress = (addr: string): boolean => {
    // 修改为支持 Base58 格式的 XDAG 地址（33个字符）
    const xdagAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{33}$/;
    return xdagAddressRegex.test(addr);
  };

  // 获取用户状态
  const fetchStatus = async () => {
    if (!validateAddress(activeAddress ?? "")) return;
    try {
      const response = await axios.get(`${xdagPortWebSite}/api/faucet?address=${activeAddress}`);
      if (response.status === 200) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('获取状态失败:', error);
    }
  };


  // 复制交易哈希
  const copyTxHash = async (txHash: string) => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 申请XDAG
  const handleClaim = async () => {
    // 添加disabled状态检查
    if (isDisabled) {
      return;
    }

    if (!activeAddress) {
      setAddressError('请输入XDAG地址');
      return;
    }
    if (!validateAddress(activeAddress)) {
      setAddressError('请输入有效的XDAG地址');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await axios.post(`${xdagPortWebSite}/api/faucet`,
        { address: activeAddress },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      setResult(response.data);

      // 更新状态
      if (response.data.success) {
        await fetchStatus();
      }
    } catch (error) {
      setResult({
        success: false,
        error: '网络错误，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !activeAddress || !!addressError || (status?.remainingRequests === 0);

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* 主卡片 */}
      <div className="bg-white dark:bg-gray-95 rounded-2xl border border-gray-45 dark:border-gray-85 shadow-DEFAULT overflow-hidden">

        <div className="p-3 space-y-3">
          {/* 状态卡片 */}
          {status && (
            <div className="bg-gradient-to-r from-sui-light to-success-light border border-sui/20 rounded-xl p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <Text variant="subtitle" weight="bold" color="hero-dark">
                    {status.remainingRequests}
                  </Text>
                  <Text variant="pSubtitleSmall" color="steel-dark">
                    剩余次数
                  </Text>
                </div>
                <div className="text-center">
                  <Text variant="subtitle" weight="bold" color="hero-dark">
                    {status.amountPerRequest}
                  </Text>
                  <Text variant="pSubtitleSmall" color="steel-dark">
                    每次获得 XDAG
                  </Text>
                </div>
              </div>
              <div className="mt-2 bg-white/60 rounded-lg p-2">
                <div className="flex justify-between items-center">
                  <Text variant="pSubtitleSmall" color="steel-darker">
                    今日进度
                  </Text>
                  <Text variant="pSubtitleSmall" weight="medium" color="steel-darker">
                    {status.dailyLimit - status.remainingRequests}/{status.dailyLimit}
                  </Text>
                </div>
                <div className="mt-1 bg-gray-50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-hero to-hero-dark h-full transition-all duration-300"
                    style={{
                      width: `${((status.dailyLimit - status.remainingRequests) / status.dailyLimit) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {addressError && (
            <div className="flex items-start gap-2 text-issue-dark">
              <Info16 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <Text variant="pSubtitleSmall">
                {addressError}
              </Text>
            </div>
          )}
        </div>

        {/* 申请按钮 */}
        <LargeButton
          onClick={handleClaim}
          disabled={isDisabled}
          loading={loading}
          center
          className={clsx(
            "w-full transition-all duration-200",
            !isDisabled && "hover:scale-101 hover:shadow-drop"
          )}
        >
          <div className="flex items-center gap-1">
            <span>{loading ? '申请中...' : '申请XDAG测试币'}</span>
          </div>
        </LargeButton>

        {/* 结果显示 */}
        {result && (
          <div className="space-y-2 mt-2">
            <Card variant="white" padding="small">
              <div className="space-y-2">
                {result.success ? (
                  <>
                    {/* 成功状态 */}
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-success-light rounded-full flex items-center justify-center">
                          <CheckStroke16 className="text-success w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <Text variant="bodySmall" weight="semibold" color="success-dark">
                          申请成功
                        </Text>
                        <Text variant="captionSmall" color="steel-dark">
                          获得 {result.amount} XDAG，节点正在确认
                        </Text>
                      </div>
                    </div>
                    
                    {/* 地址链接 */}
                    {result.address && (
                      <div className="pt-1 border-t border-gray-45">
                        <div className="flex items-center justify-center">
                          <AddressLink xdagAddress={result.address} />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* 错误状态 */}
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-issue-light rounded-full flex items-center justify-center">
                          <Info16 className="text-issue w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <Text variant="bodySmall" weight="semibold" color="issue-dark">
                          申请失败
                        </Text>
                        <Text variant="captionSmall" color="steel-dark">
                          {result.error || result.message || '未知错误'}
                        </Text>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}