import {Action} from 'redux';
import {iap} from '../../actions/actionTypes';

export interface ITransaction {
    id: string;
}

export interface IFinishedTransactionsState {
    transactions: ITransaction[];
    lastVerified: number;
}

const initialState: IFinishedTransactionsState = {
    transactions: [],
    lastVerified: 0,
};

export interface IFinishTransactionAction extends Action {
    payload: ITransaction;
}

type FinishedTransactionsActions = IFinishTransactionAction;

export default function (
    state: IFinishedTransactionsState = initialState,
    action: FinishedTransactionsActions,
): IFinishedTransactionsState {
    switch (action.type) {
        case iap.FINISH_TRANSACTION:
            const finishTransactionPayload = action.payload;
            if (state.transactions.includes(finishTransactionPayload)) return state;
            return {
                ...state,
                transactions: [...state.transactions, finishTransactionPayload],
                lastVerified: new Date().getTime(),
            };

        default:
            return state;
    }
}
