import { Request, Response } from "express";
import { storage } from "../storage";
import { insertPaymentSchema } from "@shared/schema";
import { createPaymentLink, verifyTransaction, verifyTransactionByReference, generateReference } from "../helpers/flutterwave";
import { asyncHandler, NotFoundError, BadRequestError } from "../middleware/errorHandler";

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, status } = req.query;

  const payments = await storage.getPayments({
    studentId: studentId ? parseInt(studentId as string) : undefined,
    status: status as string
  });

  res.json({
    status: "success",
    data: { payments }
  });
});

export const getPayment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payment = await storage.getPayment(parseInt(id));

  if (!payment) {
    throw new NotFoundError("Payment");
  }

  res.json({
    status: "success",
    data: { payment }
  });
});

export const initiatePayment = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, amount, description, currency = "NGN" } = req.body;

  const student = await storage.getStudent(studentId);
  if (!student) {
    throw new NotFoundError("Student");
  }

  const reference = generateReference();

  const paymentData = insertPaymentSchema.parse({
    studentId,
    amount: amount.toString(),
    currency,
    status: "pending",
    reference,
    description,
    createdById: req.user?.userId
  });

  const payment = await storage.createPayment(paymentData);

  let paymentLink: string | null = null;
  try {
    paymentLink = await createPaymentLink({
      amount: parseFloat(amount),
      currency,
      customerEmail: student.email || `${student.studentCode}@marvel-driving.com`,
      customerName: `${student.firstName} ${student.lastName}`,
      reference,
      description: description || `Payment for ${student.firstName} ${student.lastName}`,
      redirectUrl: `${process.env.APP_URL || 'http://localhost:5000'}/api/payments/callback`,
      meta: {
        studentId: student.id,
        studentCode: student.studentCode
      }
    });

    await storage.updatePayment(payment.id, { paymentLink });
  } catch (error: any) {
    console.error("Failed to create Flutterwave payment link:", error.message);
  }

  res.status(201).json({
    status: "success",
    data: {
      payment: {
        ...payment,
        paymentLink
      }
    }
  });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { transactionId, reference } = req.query;

  if (!transactionId && !reference) {
    throw new BadRequestError("Transaction ID or reference is required");
  }

  let transactionData;
  
  if (transactionId) {
    transactionData = await verifyTransaction(transactionId as string);
  } else if (reference) {
    transactionData = await verifyTransactionByReference(reference as string);
    if (!transactionData) {
      throw new NotFoundError("Transaction");
    }
  }

  if (!transactionData) {
    throw new NotFoundError("Transaction");
  }

  const payment = await storage.getPaymentByReference(transactionData.tx_ref);
  if (!payment) {
    throw new NotFoundError("Payment record");
  }

  if (transactionData.status === "successful") {
    await storage.updatePayment(payment.id, {
      status: "paid",
      flutterwaveRef: transactionData.flw_ref,
      transactionId: transactionData.id.toString(),
      paidAt: new Date()
    });

    res.json({
      status: "success",
      message: "Payment verified successfully",
      data: {
        payment: {
          ...payment,
          status: "paid",
          flutterwaveRef: transactionData.flw_ref,
          transactionId: transactionData.id.toString()
        }
      }
    });
  } else {
    await storage.updatePayment(payment.id, {
      status: "failed",
      flutterwaveRef: transactionData.flw_ref,
      transactionId: transactionData.id.toString()
    });

    res.json({
      status: "success",
      message: "Payment verification completed",
      data: {
        payment: {
          ...payment,
          status: "failed"
        }
      }
    });
  }
});

export const paymentCallback = asyncHandler(async (req: Request, res: Response) => {
  const { status, tx_ref, transaction_id } = req.query;

  if (status === "successful" && transaction_id) {
    try {
      const transactionData = await verifyTransaction(transaction_id as string);
      const payment = await storage.getPaymentByReference(transactionData.tx_ref);

      if (payment && transactionData.status === "successful") {
        await storage.updatePayment(payment.id, {
          status: "paid",
          flutterwaveRef: transactionData.flw_ref,
          transactionId: transactionData.id.toString(),
          paidAt: new Date()
        });
      }
    } catch (error) {
      console.error("Payment callback verification failed:", error);
    }
  }

  res.redirect(`${process.env.FRONTEND_URL || '/'}/payments?ref=${tx_ref}&status=${status}`);
});

export const paymentWebhook = asyncHandler(async (req: Request, res: Response) => {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  const signature = req.headers["verif-hash"];

  if (!secretHash || signature !== secretHash) {
    res.status(401).json({ status: "error", message: "Invalid webhook signature" });
    return;
  }

  const { event, data } = req.body;

  if (event === "charge.completed") {
    const payment = await storage.getPaymentByReference(data.tx_ref);
    
    if (payment && data.status === "successful") {
      await storage.updatePayment(payment.id, {
        status: "paid",
        flutterwaveRef: data.flw_ref,
        transactionId: data.id?.toString(),
        paidAt: new Date()
      });
    }
  }

  res.status(200).json({ status: "success" });
});

export const getStudentPayments = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  
  const student = await storage.getStudent(parseInt(studentId));
  if (!student) {
    throw new NotFoundError("Student");
  }

  const payments = await storage.getPayments({ studentId: parseInt(studentId) });

  const summary = {
    total: payments.length,
    paid: payments.filter(p => p.status === "paid").length,
    pending: payments.filter(p => p.status === "pending").length,
    failed: payments.filter(p => p.status === "failed").length,
    totalPaid: payments
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0),
    totalPending: payments
      .filter(p => p.status === "pending")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
  };

  res.json({
    status: "success",
    data: { payments, summary }
  });
});
