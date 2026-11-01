"use client";

import { useEffect, useRef } from "react";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { useLang } from "@/lib/client/lang";
import { establishSession, getReturnUrlParam, localReturnUrl } from "@/lib/client/session";

interface GoogleId {
  accounts: {
    id: {
      initialize(options: { client_id: string; callback: (r: { credential: string }) => void }): void;
      renderButton(el: HTMLElement, options: Record<string, string>): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleId;
  }
}

/**
 * The Google Identity Services button from Login/Register. The Google ID token
 * is exchanged for a Firebase sign-in, then for the server session cookie.
 */
export default function GoogleSignIn({ useReturnUrl, errorLabel }: { useReturnUrl: boolean; errorLabel: string }) {
  const { lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    async function handleGoogleResponse(response: { credential: string }) {
      try {
        const credential = await signInWithCredential(clientAuth(), GoogleAuthProvider.credential(response.credential));
        const result = await establishSession(credential);
        if (!result.ok) throw new Error("Google login failed");
        const target = useReturnUrl ? localReturnUrl(getReturnUrlParam()) ?? "/" : "/";
        window.location.href = result.needsPhone ? "/Account/CompleteProfile" : target;
      } catch (error) {
        console.error(errorLabel, error);
      }
    }

    function render() {
      if (!window.google || !ref.current) return;
      window.google.accounts.id.initialize({ client_id: clientId!, callback: handleGoogleResponse });
      window.google.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", width: "100%" });
    }

    const script = document.createElement("script");
    script.src = `https://accounts.google.com/gsi/client?hl=${lang}`;
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [lang, useReturnUrl, errorLabel]);

  return <div id="googleSignInBtn" ref={ref} className="google-signin-btn"></div>;
}
