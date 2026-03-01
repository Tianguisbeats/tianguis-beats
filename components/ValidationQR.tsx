"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ValidationQRProps {
    orderId: string;
    size?: number;
}

export default function ValidationQR({ orderId, size = 128 }: ValidationQRProps) {
    const verificationUrl = `https://tianguisbeats.com/verify/${orderId}`;

    return (
        <div className="flex flex-col items-center justify-center gap-3 p-4 bg-white rounded-2xl shadow-inner dark:bg-zinc-900/50">
            <div className="p-2 bg-white rounded-lg">
                <QRCodeSVG
                    value={verificationUrl}
                    size={size}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                        src: "/favicon.png", // Assuming favicon exists, or remove if not
                        x: undefined,
                        y: undefined,
                        height: 24,
                        width: 24,
                        excavate: true,
                    }}
                />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono truncate max-w-full">
                {verificationUrl}
            </p>
        </div>
    );
}
