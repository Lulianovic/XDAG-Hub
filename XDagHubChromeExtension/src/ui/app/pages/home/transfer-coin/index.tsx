import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { PreviewTransfer } from "./PreviewTransfer";
import { SendTokenForm } from "./SendTokenForm";
import { Button } from "_app/shared/ButtonUI";
import BottomMenuLayout, { Content, Menu, } from "_app/shared/bottom-menu-layout";
import { ArrowRight16, ArrowLeft16 } from "_assets/icons/tsIcons";
import { ActiveCoinsCard } from "_components/active-coins-card";
import Overlay from "_components/overlay";
import { useCoinMetadata } from "_shared/hooks";
import { getSignerOperationErrorMessage } from "_src/ui/app/helpers/errorMessages";
import { useActiveAddress } from "_src/ui/app/hooks/useActiveAddress";
import { getTransactionDigest } from "_src/xdag/typescript/types";
import type { SubmitProps } from "./SendTokenForm";
import { useTranslation } from "react-i18next";
import { useAppSelector, useSignerBridge } from "_src/ui/app/hooks";
import { TransactionBlock } from "_src/xdag/typescript/builder";
import RpcBridge from "_src/ui/app/UiBridge/RpcBridge";
import { fromB64, fromHEX, toHEX } from "_src/xdag/bcs";
import { uiBridge } from "_src/ui/app/redux/store/thunk-extras";
import { TransactionHelper } from "_src/xdag/typescript/builder/TransactionHelper";
import { useActiveAccount } from "_src/ui/app/hooks/useActiveAccount";
import { extractSignatureBytes } from "_src/xdag/typescript/cryptography";


function TransferCoinPage() {
	const [searchParams] = useSearchParams();
	const coinType = searchParams.get("type");
	const [showTransactionPreview, setShowTransactionPreview] = useState<boolean>(false);
	const [formData, setFormData] = useState<SubmitProps>();
	const navigate = useNavigate();
	const { data: coinMetadata } = useCoinMetadata(coinType);
	const signerBridge = useSignerBridge();
	const address = useActiveAddress();
	const queryClient = useQueryClient();
	const { t } = useTranslation();
	const [nonce, setNonce] = useState<string | null>(null);
	const activeAccount = useActiveAccount();
	const apiEnv = useAppSelector( ( state ) => state.app.apiEnv );


	useEffect(() => {
		if (!signerBridge || !address) return;
		RpcBridge.instance.provider.getNonce(address).then(setNonce);
	}, [signerBridge, address]);

	const transactionBlock: TransactionBlock | null = useMemo(() => {
		if (!signerBridge || !formData || !address || !nonce || !activeAccount?.publicKey) {
			console.log("Missing data when create transactionBlock");
			return null;
		}
		console.log("formData", formData, address, coinType, coinMetadata);
		const txInfo = {
			sender: address,
			to: formData.to,
			amount: formData.amount,
			remark: formData.remark,
			nonce: nonce,
			senderPublicKey: activeAccount.publicKey,
			networkEnv: apiEnv
		};
		const tx = TransactionHelper.createTransactionBlock(txInfo);
		console.log("tx in useMemo:", txInfo);
		return tx;
	}, [formData, signerBridge, address, nonce]);

	const executeTransfer = useMutation({
		mutationFn: async () => {
			if (!transactionBlock || !signerBridge) {
				throw new Error("Missing data");
			}
			try {
				const digest = await transactionBlock?.buildPart();
				if (!digest) {
					throw new Error("buildPart return null when buildPart in useMemo in TransferCoinPage.tsx");
				}
				const hSignedObj = await signerBridge.signData(digest);
				const hSign = extractSignatureBytes(hSignedObj); 
				console.log("tx hash singed from backserver:\n", toHEX(hSign));
				const signData = await transactionBlock.buildFinally(hSign);
				const response = uiBridge.rpcBridge.provider.executeSendRawTransaction(transactionBlock,signData)
				return response
			} catch (error) {
				console.log("error in executeTransfer", error);
				throw error;
			}
		},
		onSuccess: (response) => {
			queryClient.invalidateQueries(["coin-balance"]);
			const receiptUrl = `/receipt?blockAddress=${encodeURIComponent(response.hash)}&from=transactions`;
			return navigate(receiptUrl);
		},
		onError: (error) => {
			toast.error(
				<div className="max-w-xs overflow-hidden flex flex-col">
					<small className="text-ellipsis overflow-hidden">
						{getSignerOperationErrorMessage(error)}
					</small>
				</div>,
			);
		},
	});

	if (!coinType) {
		return <Navigate to="/" replace={true} />;
	}

	return (
		<Overlay
			showModal={true}
			title={showTransactionPreview ? t("TransferCoinPage.ReviewSend") : t("TransferCoinPage.SendCoins")}
			closeOverlay={() => navigate("/")}
		>
			<div className="flex flex-col w-full mt-2.5">

				{showTransactionPreview && formData ? (
					<BottomMenuLayout>
						<Content>
							<PreviewTransfer
								coinType={coinType}
								amount={formData.amount}
								to={formData.to}
								approximation={formData.isPayAllXDag}
								gasBudget={formData.gasBudgetEst}
								remark={formData.remark}
							/>
						</Content>
						<Menu stuckClass="sendCoin-cta" className="w-full px-0 pb-0 mx-0 gap-2.5">
							<Button
								type="button"
								variant="secondary"
								onClick={() => setShowTransactionPreview(false)}
								text={t("TransferCoinPage.Back")}
								before={<ArrowLeft16 />}
							/>
							<Button
								type="button"
								variant="primary"
								onClick={() => executeTransfer.mutateAsync()}
								text={t("TransferCoinPage.SendNow")}
								disabled={coinType === null}
								after={<ArrowRight16 />}
								loading={executeTransfer.isLoading}
							/>
						</Menu>
					</BottomMenuLayout>
				) : (
					<>
						<div className="mb-2 flex flex-col gap-1">
							{/*<div className="pl-1.5">*/}
							{/*	<Text variant="caption" color="steel" weight="semibold">*/}
							{/*		Select all Coins*/}
							{/*	</Text>*/}
							{/*</div>*/}
							<ActiveCoinsCard activeCoinType={coinType} />
						</div>

						<SendTokenForm
							onSubmit={(formData) => {
								setShowTransactionPreview(true);
								setFormData(formData);
							}}
							coinType={coinType}
							initialAmount={formData?.amount || ""}
							initialTo={formData?.to || ""}
							initialRemark={formData?.remark ?? ""}
						/>
					</>
				)}
			</div>
			{/*{notificationModal}*/}
		</Overlay>
	);
}

export default TransferCoinPage;
