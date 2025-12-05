import axios from "axios";

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3";

interface PaymentLinkData {
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  reference: string;
  description?: string;
  redirectUrl?: string;
  meta?: Record<string, any>;
}

interface PaymentLinkResponse {
  status: string;
  message: string;
  data: {
    link: string;
  };
}

interface TransactionVerificationResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: string;
    payment_type: string;
    created_at: string;
    account_id: number;
    customer: {
      id: number;
      name: string;
      phone_number: string | null;
      email: string;
      created_at: string;
    };
  };
}

function getAuthHeaders() {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("FLUTTERWAVE_SECRET_KEY is not configured");
  }
  return {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };
}

export async function createPaymentLink(data: PaymentLinkData): Promise<string> {
  try {
    const response = await axios.post<PaymentLinkResponse>(
      `${FLUTTERWAVE_BASE_URL}/payments`,
      {
        tx_ref: data.reference,
        amount: data.amount,
        currency: data.currency,
        redirect_url: data.redirectUrl || process.env.PAYMENT_REDIRECT_URL || "https://your-app.com/payment/callback",
        customer: {
          email: data.customerEmail,
          name: data.customerName,
        },
        customizations: {
          title: "Marvel Driving School",
          description: data.description || "Payment for driving school services",
          logo: "https://marvel-driving-school.com/logo.png",
        },
        meta: data.meta,
      },
      { headers: getAuthHeaders() }
    );

    if (response.data.status === "success") {
      return response.data.data.link;
    }

    throw new Error(response.data.message || "Failed to create payment link");
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Flutterwave API error: ${error.response?.data?.message || error.message}`
      );
    }
    throw error;
  }
}

export async function verifyTransaction(
  transactionId: string
): Promise<TransactionVerificationResponse["data"]> {
  try {
    const response = await axios.get<TransactionVerificationResponse>(
      `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
      { headers: getAuthHeaders() }
    );

    if (response.data.status === "success") {
      return response.data.data;
    }

    throw new Error(response.data.message || "Transaction verification failed");
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Flutterwave verification error: ${error.response?.data?.message || error.message}`
      );
    }
    throw error;
  }
}

export async function verifyTransactionByReference(
  txRef: string
): Promise<TransactionVerificationResponse["data"] | null> {
  try {
    const response = await axios.get<{
      status: string;
      message: string;
      data: TransactionVerificationResponse["data"][];
    }>(
      `${FLUTTERWAVE_BASE_URL}/transactions?tx_ref=${txRef}`,
      { headers: getAuthHeaders() }
    );

    if (response.data.status === "success" && response.data.data.length > 0) {
      return response.data.data[0];
    }

    return null;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Flutterwave lookup error: ${error.response?.data?.message || error.message}`
      );
    }
    throw error;
  }
}

export function verifyWebhookSignature(
  signature: string,
  secretHash: string
): boolean {
  return signature === secretHash;
}

export function generateReference(prefix: string = "MDS"): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${randomStr}`;
}
