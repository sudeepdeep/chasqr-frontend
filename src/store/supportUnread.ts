import { Store } from 'pullstate';

interface SupportUnreadState {
  unreadByRequest: Record<string, number>;
  openRequestId: string | null;
}

export const SupportUnreadStore = new Store<SupportUnreadState>({
  unreadByRequest: {},
  openRequestId: null,
});

export const incrementUnread = (requestId: string) => {
  SupportUnreadStore.update((s) => {
    s.unreadByRequest[requestId] = (s.unreadByRequest[requestId] || 0) + 1;
  });
};

export const clearUnread = (requestId: string) => {
  SupportUnreadStore.update((s) => {
    delete s.unreadByRequest[requestId];
  });
};

export const setOpenSupportRequest = (requestId: string | null) => {
  SupportUnreadStore.update((s) => { s.openRequestId = requestId; });
};

export const resetSupportUnread = () => {
  SupportUnreadStore.update((s) => {
    s.unreadByRequest = {};
    s.openRequestId = null;
  });
};

export const totalUnread = (state: SupportUnreadState) =>
  Object.values(state.unreadByRequest).reduce((a, b) => a + b, 0);
