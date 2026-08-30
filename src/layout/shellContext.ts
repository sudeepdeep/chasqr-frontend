import { createContext, useContext } from "react";

/**
 * Whether the page is rendering inside the signed-in app shell.
 *
 * The public navbar is fixed, so public pages carry their own top padding to
 * clear it. The shell header is sticky and takes up its own space, so that
 * same padding becomes a gap. Pages served under both layouts need to know
 * which one they are in — there is no way to infer it from CSS alone.
 */
export const InShellContext = createContext(false);

export const useInShell = () => useContext(InShellContext);
