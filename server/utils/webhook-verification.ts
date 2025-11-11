import crypto from 'crypto';

/**
 * Verify Stripe webhook signature
 */
export function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const elements = signature.split(',');
    const signatureHash = elements.find(el => el.startsWith('v1='))?.split('=')[1];
    const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1];

    if (!signatureHash || !timestamp) {
      return false;
    }

    // Check timestamp to prevent replay attacks (5 minutes tolerance)
    const currentTime = Math.floor(Date.now() / 1000);
    const eventTime = parseInt(timestamp);
    if (currentTime - eventTime > 300) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(timestamp + '.' + payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signatureHash, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Stripe signature verification error:', error);
    return false;
  }
}

/**
 * Verify Strike webhook signature
 */
export function verifyStrikeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Strike signature verification error:', error);
    return false;
  }
}

/**
 * Verify Breez webhook signature
 */
export function verifyBreezSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Breez signature verification error:', error);
    return false;
  }
}

/**
 * Generic webhook signature verification
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Generic webhook signature verification error:', error);
    return false;
  }
}

/**
 * Validate webhook timestamp to prevent replay attacks
 */
export function validateWebhookTimestamp(timestamp: number, toleranceSeconds: number = 300): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  return Math.abs(currentTime - timestamp) <= toleranceSeconds;
}

/**
 * Extract signature and timestamp from Stripe signature header
 */
export function parseStripeSignature(signature: string): { signature: string; timestamp: number } | null {
  try {
    const elements = signature.split(',');
    const signatureHash = elements.find(el => el.startsWith('v1='))?.split('=')[1];
    const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1];

    if (!signatureHash || !timestamp) {
      return null;
    }

    return {
      signature: signatureHash,
      timestamp: parseInt(timestamp),
    };
  } catch (error) {
    console.error('Stripe signature parsing error:', error);
    return null;
  }
}
