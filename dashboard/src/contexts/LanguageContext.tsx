import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface LanguageContextType {
    language: string;
    changeLanguage: (code: string) => void;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Fix for Google Translate + React Conflict: "Failed to execute 'removeChild' on 'Node'"
if (typeof window !== 'undefined' && typeof Node !== 'undefined' && Node.prototype) {
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
        if (child.parentNode !== this) {
            if (window.console) {
                console.warn('Google Translate fix: Component unmounted but DOM was modified. Preventing crash.', child, this);
            }
            return child;
        }
        return originalRemoveChild.call(this, child) as T;
    };

    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
        if (referenceNode && referenceNode.parentNode !== this) {
            if (window.console) {
                console.warn('Google Translate fix: Reference node is not a child of this node. Appending instead.', newNode, referenceNode, this);
            }
            return this.appendChild(newNode);
        }
        return originalInsertBefore.call(this, newNode, referenceNode) as T;
    };
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [language, setLanguage] = useState(
        localStorage.getItem("app_language") || "en",
    );
    const [isLoading, setIsLoading] = useState(true);

    const initGoogleTranslate = useCallback(() => {
        if ((window as any).google?.translate?.TranslateElement) {
            setIsLoading(false);
            return;
        }

        (window as any).googleTranslateElementInit = () => {
            new (window as any).google.translate.TranslateElement(
                {
                    pageLanguage: "en",
                    autoDisplay: false,
                    layout: (window as any).google.translate.TranslateElement.InlineLayout
                        .SIMPLE,
                },
                "google_translate_element",
            );
            setIsLoading(false);
        };

        if (!document.getElementById("google-translate-script")) {
            const script = document.createElement("script");
            script.id = "google-translate-script";
            script.src =
                "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
            script.async = true;
            document.body.appendChild(script);

            // Inject CSS to hide Google Translate UI
            const style = document.createElement("style");
            style.innerHTML = `
        /* Hide Google Translate Banner and Iframe */
        iframe.skiptranslate,
        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate,
        .goog-te-balloon-frame,
        #goog-gt-tt,
        .goog-te-banner,
        .goog-te-menu-value,
        .goog-te-menu-frame,
        .goog-te-gadget-icon,
        .goog-te-gadget-simple {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
        }
        /* Prevent body from shifting down */
        body {
          top: 0px !important;
          position: static !important;
        }
        /* Disable text highlighting */
        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
          border: none !important;
        }
      `;
            document.head.appendChild(style);
        }
    }, []);

    useEffect(() => {
        initGoogleTranslate();

        // Check for existing cookie and set language accordingly
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(";").shift();
            return null;
        };

        const googtrans = getCookie("googtrans");
        if (googtrans) {
            const lang = googtrans.split("/").pop();
            if (lang && lang !== language) {
                setLanguage(lang);
                localStorage.setItem("app_language", lang);
            }
        }
    }, [initGoogleTranslate, language]);

    const changeLanguage = (code: string) => {
        setLanguage(code);
        localStorage.setItem("app_language", code);

        // Set cookie for Google Translate
        const cookieValue = `/en/${code}`;
        const expires = new Date(Date.now() + 365 * 864e5).toUTCString();

        // Set for current path and domain
        document.cookie = `googtrans=${cookieValue}; expires=${expires}; path=/;`;

        // Also set for domain if needed
        const domainParts = window.location.hostname.split(".");
        if (domainParts.length > 1) {
            const domain = "." + domainParts.slice(-2).join(".");
            document.cookie = `googtrans=${cookieValue}; expires=${expires}; path=/; domain=${domain};`;
        }

        if (code === "en") {
            // Clear cookies for English
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            if (domainParts.length > 1) {
                const domain = "." + domainParts.slice(-2).join(".");
                document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
            }
        }

        // Force reload to apply changes globally
        window.location.reload();
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, isLoading }}>
            {children}
            {/* Hidden element for Google Translate to attach to */}
            <div id="google_translate_element" style={{ display: 'none', visibility: 'hidden', position: 'absolute', top: '-9999px' }} />
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
