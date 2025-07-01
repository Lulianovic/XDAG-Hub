import { useEffect, useMemo, useState } from "react";
import { GasFees } from "./GasFees";
import { TransactionDetails } from "./TransactionDetails";
import { ConfirmationModal } from "../../../shared/ConfirmationModal";
import { UserApproveContainer } from "_components/user-approve-container";
import {
	useAppDispatch,
	useAppSelector,
	useSignerBridge,
} from "_hooks";
import { type TransactionApprovalRequest } from "_payloads/transactions/ApprovalRequest";
import { respondToTransactionRequest } from "_redux/slices/transaction-requests";
import { useTransactionSummary } from "_shared/hooks";
import { PageMainLayoutTitle } from "_src/ui/app/shared/page-main-layout/PageMainLayoutTitle";
import { TransactionSummary } from "_src/ui/app/shared/transaction-summary";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { uiBridge } from "_src/ui/app/redux/store/thunk-extras";
import { TransactionHelper } from "_src/xdag/typescript/builder/TransactionHelper";
import { useActiveAccount } from "_src/ui/app/hooks/useActiveAccount";

export type TransactionRequestProps = {
	txRequest: TransactionApprovalRequest;
};

export function TransactionRequest({ txRequest }: TransactionRequestProps) {

	const addressForTransaction = txRequest.tx.accountAddress;
	const signer = useSignerBridge();
	const dispatch = useAppDispatch();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const account = useActiveAccount();
	const apiEnv = useAppSelector(( state ) => state.app.apiEnv );
	
	// 使用 useState 来存储 transaction
	const [transaction, setTransaction] = useState<any>(null);

	// 使用 useEffect 来处理异步操作
	useEffect(() => {
		const initTransaction = async () => {
			try {
				const sender = txRequest.tx.accountAddress;
				const amount = String(txRequest.tx.amount);
				const remark = txRequest.tx?.remark ?? "";
				const to = txRequest.tx.toAddress;
				if (!to || !amount || !sender) {
					throw new Error("Invalid transaction request in respondToTransactionRequest");
				}
				const nonce = await uiBridge.rpcBridge.provider.getNonce(sender);
				if (nonce === null || nonce === "0") {
					throw new Error("Invalid nonce from xdag block chain");
				}
				const tx = TransactionHelper.createTransactionBlock({
					senderPublicKey: account?.publicKey,
					sender,
					amount,
					remark,
					to,
					nonce,
					networkEnv:apiEnv
				});
				setTransaction(tx);
			} catch (error) {
				console.error('Failed to initialize transaction:', error);
			}
		};
		initTransaction();
	}, [txRequest.tx, addressForTransaction]);

	const [isConfirmationVisible, setConfirmationVisible] = useState(false);
	const summary = useTransactionSummary({ transaction: undefined, currentAddress: addressForTransaction, });

	if (!signer) {
		return null;
	}

	const handleSubmit = async (approved: boolean) => {
		if (approved) {
			setConfirmationVisible(true);
			return;
		} else {
			window.close();
		}
		await dispatch(respondToTransactionRequest({ approved, txRequestID: txRequest.id }));
	};

	const handleResponse = async (isConfirmed: boolean) => {
		if (!isConfirmed) {
			window.close();
		}
		const result = await dispatch(respondToTransactionRequest({approved: isConfirmed, txRequestID: txRequest.id}));
		const txAddress = (result as any)?.payload?.txResponse?.address;
		const receiptUrl = `/receipt?blockAddress=${encodeURIComponent(txAddress)}&from=transactions`;
		setConfirmationVisible(false);
		return navigate(receiptUrl);
	};

	return (
		<>
			<UserApproveContainer
				origin={txRequest.origin}
				originFavIcon={txRequest.originFavIcon}
				approveTitle={t("TransactionRequest.Approve")}
				rejectTitle={t("TransactionRequest.Reject")}
				onSubmit={handleSubmit}
				address={addressForTransaction}
				approveLoading={false || isConfirmationVisible}
			>
				<PageMainLayoutTitle title={t("TransactionRequest.ApproveTransaction")} />

				<div className="flex flex-col gap-4">
					<TransactionSummary
						isDryRun
						// isLoading={isDryRunLoading}
						// isError={isDryRunError}
						isLoading={true}
						isError={true}
						showGasSummary={false}
						summary={summary}
					/>
				</div>
				<section className="flex flex-col gap-4">
					<GasFees sender={addressForTransaction} transaction={transaction} />
					<TransactionDetails
						sender={addressForTransaction}
						transaction={transaction}
					/>
				</section>
			</UserApproveContainer>
			<ConfirmationModal
				isOpen={isConfirmationVisible}
				title={t("TransactionRequest.MightFailWarning")}
				hint={t("TransactionRequest.ChargedGasFeeWarning")}
				confirmStyle="primary"
				confirmText={t("TransactionRequest.Approve")}
				cancelText={t("TransactionRequest.Reject")}
				cancelStyle="warning"
				onResponse={handleResponse}
			/>
			{/*{notificationModal}*/}
		</>
	);
}
