import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    /** Raw request body captured by express.json verify (e.g. Razorpay webhooks). */
    rawBody?: Buffer;
  }
}

export {};
