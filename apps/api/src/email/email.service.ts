import { Injectable, Logger } from '@nestjs/common';

type OrderEmail = {
  orderNumber: string;
  email: string;
  firstName: string;
  totalPence: number;
  itemCount: number;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendOrderPlaced(order: OrderEmail) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    const admin = process.env.ORDER_ALERT_EMAIL;
    if (!apiKey || !from) {
      this.logger.warn(`Order email skipped for ${order.orderNumber}: configure RESEND_API_KEY and EMAIL_FROM`);
      return { sent: false, reason: 'email_not_configured' };
    }
    const recipients = [order.email, admin].filter((value): value is string => Boolean(value));
    const total = `£${(order.totalPence / 100).toFixed(2)}`;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: `Order ${order.orderNumber} received — Xclusivez 4 You`,
        html: `<p>Hi ${this.escape(order.firstName)},</p><p>Thanks for your order. We have received <strong>${order.orderNumber}</strong> with ${order.itemCount} item(s), totalling <strong>${total}</strong>.</p><p>We will email you again when it is dispatched.</p><p>— Xclusivez 4 You</p>`,
      }),
    });
    if (!response.ok) {
      this.logger.error(`Order email failed for ${order.orderNumber}: ${response.status}`);
      return { sent: false, reason: 'provider_error' };
    }
    return { sent: true };
  }

  private escape(value: string) { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character); }
}
