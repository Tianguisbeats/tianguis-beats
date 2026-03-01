"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ValidationQRProps {
    orderId: string;
    size?: number;
}

export default function ValidationQR({ orderId, size = 128 }: ValidationQRProps) {
    const verificationUrl = `https://tianguisbeats.com/verify?id=${orderId}`;

    return (
        <div className="flex flex-col items-center justify-center p-1 bg-white rounded-lg">
            <QRCodeSVG
                value={verificationUrl}
                size={size}
                level="H"
                includeMargin={false}
                imageSettings={{
                    src: "/favicon.png",
                    x: undefined,
                    y: undefined,
                    height: 24,
                    width: 24,
                    excavate: true,
                }}
            />
        </div>
    );
}
