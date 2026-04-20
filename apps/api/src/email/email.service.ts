import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

interface OwnerRegistrationOtpEmailInput {
  to: string;
  fullName: string;
  otpCode: string;
  expiresInMinutes: number;
  storeName: string;
}

interface BackInStockEmailInput {
  to: string;
  productTitle: string;
  productUrl: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private smtpTransporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendOwnerRegistrationOtp(input: OwnerRegistrationOtpEmailInput): Promise<void> {
    const mode = this.configService.get<string>('EMAIL_DELIVERY_MODE', 'log');
    const from = this.configService.get<string>('EMAIL_FROM', 'no-reply@kaleem.store');
    const subject = 'رمز التحقق لتفعيل حسابك في كليم ستور';
    const text = [
      `مرحباً ${input.fullName},`,
      '',
      `رمز التحقق الخاص بك لمتجر "${input.storeName}" هو: ${input.otpCode}`,
      `صلاحية الرمز: ${input.expiresInMinutes} دقيقة.`,
      '',
      'إذا لم تطلب إنشاء حساب، تجاهل هذه الرسالة.',
    ].join('\n');

    if (mode === 'smtp') {
      await this.sendWithSmtp({
        to: input.to,
        from,
        subject,
        text,
      });
      return;
    }

    if (mode === 'resend') {
      await this.sendWithResend({
        to: input.to,
        from,
        subject,
        text,
      });
      return;
    }

    this.logger.log(
      `OTP email (mode=log) to ${input.to}. Code: ${input.otpCode}. Expires in ${input.expiresInMinutes} minutes.`,
    );
  }

  async sendBackInStockAlert(input: BackInStockEmailInput): Promise<void> {
    const mode = this.configService.get<string>('EMAIL_DELIVERY_MODE', 'log');
    const from = this.configService.get<string>('EMAIL_FROM', 'no-reply@kaleem.store');
    const subject = 'Product back in stock';
    const text = [
      'A product you asked about is available again.',
      '',
      `Product: ${input.productTitle}`,
      `Open product: ${input.productUrl}`,
      '',
      'This link may expire after a limited time.',
    ].join('\n');

    if (mode === 'smtp') {
      await this.sendWithSmtp({
        to: input.to,
        from,
        subject,
        text,
      });
      return;
    }

    if (mode === 'resend') {
      await this.sendWithResend({
        to: input.to,
        from,
        subject,
        text,
      });
      return;
    }

    this.logger.log(
      `Back-in-stock email (mode=log) to ${input.to}. Product: ${input.productTitle}. Link: ${input.productUrl}`,
    );
  }

  private async sendWithResend(input: {
    to: string;
    from: string;
    subject: string;
    text: string;
  }): Promise<void> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY', '');
    const baseUrl = this.configService.get<string>('RESEND_API_BASE_URL', 'https://api.resend.com');

    if (!apiKey) {
      throw new Error('المتغير RESEND_API_KEY مطلوب عند ضبط EMAIL_DELIVERY_MODE=resend');
    }

    const response = await fetch(`${baseUrl}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const raw = await response.text();
      throw new Error(`فشل إرسال البريد عبر Resend (${response.status}): ${raw}`);
    }
  }

  private async sendWithSmtp(input: {
    to: string;
    from: string;
    subject: string;
    text: string;
  }): Promise<void> {
    const transporter = this.getSmtpTransporter();

    await transporter.sendMail({
      from: input.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
  }

  private getSmtpTransporter(): Transporter {
    if (this.smtpTransporter) {
      return this.smtpTransporter;
    }

    const host = this.configService.get<string>('SMTP_HOST', '');
    const port = this.configService.get<number>('SMTP_PORT', 465);
    const secure = this.configService.get<boolean>('SMTP_SECURE', true);
    const user = this.configService.get<string>('SMTP_USER', '');
    const pass = this.configService.get<string>('SMTP_PASS', '');

    if (!host || !user || !pass) {
      throw new Error('إعدادات SMTP غير مكتملة. تأكد من SMTP_HOST وSMTP_USER وSMTP_PASS');
    }

    this.smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    return this.smtpTransporter;
  }
}
