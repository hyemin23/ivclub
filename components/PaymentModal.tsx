'use client';

import { useEffect, useRef, useState } from 'react';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';
import { useStore } from '../store'; // Assuming you have a store for user info or use a random ID

const clientKey = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN349R0'; // Test Client Key
const customerKey = 'test_customer_key_1234'; // Random customer key for guest/test

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    orderName: string;
}

export function PaymentModal({ isOpen, onClose, amount, orderName }: PaymentModalProps) {
    const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
    const paymentMethodsWidgetRef = useRef<ReturnType<PaymentWidgetInstance['renderPaymentMethods']> | null>(null);
    const [price, setPrice] = useState(amount);

    useEffect(() => {
        if (!isOpen) return;

        (async () => {
            const paymentWidget = await loadPaymentWidget(clientKey, customerKey);

            if (paymentWidgetRef.current == null) {
                paymentWidgetRef.current = paymentWidget;
            }

            const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
                '#payment-widget',
                { value: amount },
                { variantKey: 'DEFAULT' }
            );

            paymentMethodsWidgetRef.current = paymentMethodsWidget;

            paymentWidget.renderAgreement(
                '#agreement',
                { variantKey: 'AGREEMENT' }
            );
        })();
    }, [isOpen, amount]);

    const handlePayment = async () => {
        const paymentWidget = paymentWidgetRef.current;

        try {
            await paymentWidget?.requestPayment({
                orderId: `order_${Date.now()}`, // Unique order ID
                orderName: orderName,
                customerName: 'NanoBanana Customer',
                customerEmail: 'customer@example.com',
                successUrl: `${window.location.origin}/payment/success`,
                failUrl: `${window.location.origin}/payment/fail`,
            });
        } catch (error) {
            console.error('Payment failed', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden border border-slate-700">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold">결제하기</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <div className="p-6">
                    {/* Payment Widget Render Container */}
                    <div id="payment-widget" />
                    <div id="agreement" />
                </div>

                <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold">
                        취소
                    </button>
                    <button
                        onClick={handlePayment}
                        className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                    >
                        {amount.toLocaleString()}원 결제하기
                    </button>
                </div>
            </div>
        </div>
    );
}
