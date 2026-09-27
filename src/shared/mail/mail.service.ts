import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { type Configuration } from '../../config/configuration';

export interface CourseDeliveryMail {
  customerName: string;
  email: string;
  orderNumber: string;
  courseTitle: string;
  driveFolderUrl: string;
  amount: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  constructor(private readonly config: ConfigService<Configuration>) {
    const user = config.get('mail.gmailUser', { infer: true });
    const password = config.get('mail.gmailAppPassword', { infer: true });
    this.transporter =
      user && password
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass: password },
          })
        : null;
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendCourseDelivery(mail: CourseDeliveryMail): Promise<void> {
    if (!this.transporter) throw new Error('Gmail SMTP is not configured');
    const from = this.config.get('mail.gmailUser', { infer: true });
    await this.transporter.sendMail({
      from,
      to: mail.email,
      subject: `تفاصيل طلبك ${mail.orderNumber} - رابط الكورس`,
      text: `مرحباً ${mail.customerName}\n\nتم تأكيد شراء الكورس: ${mail.courseTitle}\nرقم الطلب: ${mail.orderNumber}\nالإجمالي: ${mail.amount}\nرابط المحتوى: ${mail.driveFolderUrl}\n\nشكراً لثقتك بنا.`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif"><h2>تم تأكيد طلبك</h2><p>مرحباً ${mail.customerName}،</p><p>تم تأكيد شراء الكورس: <strong>${mail.courseTitle}</strong></p><p>رقم الطلب: ${mail.orderNumber}<br>الإجمالي: ${mail.amount}</p><p><a href="${mail.driveFolderUrl}">فتح محتوى الكورس</a></p><p>شكراً لثقتك بنا.</p></div>`,
    });
    this.logger.log(`Course delivery email sent for order ${mail.orderNumber}`);
  }

  async sendPasswordResetOtp(email: string, fullName: string, otp: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`[PASSWORD RESET DEV MODE] Gmail SMTP not yet configured. OTP for ${email}: ${otp}`);
      return;
    }
    const from = this.config.get('mail.gmailUser', { infer: true });
    await this.transporter.sendMail({
      from,
      to: email,
      subject: `رمز استعادة كلمة المرور - أكاديمية أنس يعقوب (${otp})`,
      text: `مرحباً ${fullName}،\n\nرمز التحقق لإعادة تعيين كلمة المرور هو: ${otp}\nصلاحية هذا الرمز 15 دقيقة فقط.\nإذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.`,
      html: `
        <div dir="rtl" style="font-family:'Segoe UI',Tahoma,Arial,sans-serif; background:#f7f3ec; padding:40px 15px; text-align:center;">
          <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:18px; padding:36px 28px; border:1px solid rgba(195,154,95,0.3); box-shadow:0 12px 36px rgba(0,0,0,0.06);">
            <div style="font-size:38px; margin-bottom:10px;">🎓</div>
            <h2 style="color:#17382f; margin:0 0 6px; font-size:22px;">أكاديمية أنس يعقوب للفنون التشكيلية</h2>
            <p style="color:#c39a5f; font-size:14px; font-weight:bold; margin:0 0 24px;">طلب إعادة تعيين كلمة المرور</p>
            <p style="color:#4b5563; font-size:15px; line-height:1.7; margin:0 0 24px;">
              مرحباً <strong>${fullName}</strong>،<br>
              لقد تلقينا طلباً لاستعادة كلمة المرور الخاصة بحسابك في منصة الكورسات. يرجى استخدام رمز التحقق أدناه لإكمال العملية:
            </p>
            <div style="background:#fbf5e8; border:2px dashed #c39a5f; border-radius:14px; padding:20px; margin:0 0 24px;">
              <span style="font-size:36px; font-weight:900; letter-spacing:10px; color:#17382f; display:inline-block; font-family:monospace;">${otp}</span>
            </div>
            <p style="color:#6b7280; font-size:13px; margin:0 0 16px;">
              ⏱️ هذا الرمز صالح لمدة <strong>15 دقيقة فقط</strong> ولا يمكن استخدامه سوى مرة واحدة.
            </p>
            <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0 18px;">
            <p style="color:#9ca3af; font-size:11px; margin:0;">
              إذا لم تقم بطلب إعادة تعيين كلمة المرور، فلا داعي للقلق، حسابك في أمان تام ويمكنك تجاهل هذه الرسالة.
            </p>
          </div>
        </div>
      `,
    });
    this.logger.log(`Password reset OTP email successfully sent to ${email}`);
  }
}
