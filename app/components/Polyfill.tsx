"use client";

import { useEffect } from "react";
import { Buffer } from "buffer";

export default function Polyfill() {
    useEffect(() => {
        if (typeof window !== "undefined" && !window.Buffer) {
            (window as any).Buffer = Buffer;
        }
    }, []);

    return null;
}
