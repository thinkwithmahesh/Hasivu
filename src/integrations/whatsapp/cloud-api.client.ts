import crypto from 'crypto';
import { logger } from '../../utils/logger';

export type WhatsAppTemplateMessage = {
  recipientPhone: string;
  templateName: string;
  language: string;
  variables: Record<string, string>;
};

export class WhatsAppCloudApiClient {
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';
  private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? '';
  private readonly appSecret = process.env.WHATSAPP_APP_SECRET ?? '';
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';

  isConfigured(): boolean {
    return Boolean(this.phoneNumberId && this.accessToken && this.appSecret);
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
    if (!signature || !this.appSecret) {
      return false;
    }

    const expected = `sha256=${crypto
      .createHmac('sha256', this.appSecret)
      .update(rawBody)
      .digest('hex')}`;

    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  }

  async sendTemplate(
    message: WhatsAppTemplateMessage
  ): Promise<{ messageId: string; status: string }> {
    if (!this.isConfigured()) {
      throw Object.assign(new Error('WhatsApp Cloud API is not configured'), {
        code: 'WHATSAPP_PROVIDER_UNAVAILABLE',
        statusCode: 503,
      });
    }

    const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: message.recipientPhone,
        type: 'template',
        template: {
          name: message.templateName,
          language: { code: message.language },
          components: [
            {
              type: 'body',
              parameters: Object.values(message.variables).map(value => ({
                type: 'text',
                text: value,
              })),
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error('WhatsApp Cloud API send failed', undefined, {
        status: response.status,
        templateName: message.templateName,
        body,
      });
      throw Object.assign(new Error('WhatsApp provider rejected the message'), {
        code: 'WHATSAPP_PROVIDER_UNAVAILABLE',
        statusCode: 503,
      });
    }

    const body = (await response.json()) as { messages?: Array<{ id?: string }> };
    return {
      messageId: body.messages?.[0]?.id ?? 'unknown',
      status: 'sent',
    };
  }
}
