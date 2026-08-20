// Late-bound reference to the singleton QueryClient.
//
// The middleware in store.js needs to invalidate queries, but importing
// conf/queryClient directly from there closes an import cycle
// (store → middleware → queryClient → store — queryClient dispatches on
// 401 through the store). This module has no imports of its own, so it
// breaks that ring while still handing the client to any non-React caller
// that needs it.

let ref = null;

export const setQueryClient = client => {
  ref = client;
};

export const getQueryClient = () => ref;
