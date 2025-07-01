import { BackgroundBridge } from "_src/ui/app/UiBridge/BackgroundBridge";
import type { RootState } from "_redux/RootReducer";
import type { AppDispatch } from "_store";
import UiBridge from "../../UiBridge";


export const uiBridge = UiBridge.instance

export const thunkExtras = {
  uiBridge: UiBridge.instance,
  background: BackgroundBridge.instance
};

type ThunkExtras = typeof thunkExtras;

export interface AppThunkConfig {
  extra: ThunkExtras;
  state: RootState;
  dispatch: AppDispatch;
}
