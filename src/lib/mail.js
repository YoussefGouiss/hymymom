import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

export async function sendVerificationEmail(email, name, code, type = 'verify') {
  const isPasswordReset = type === 'password';
  
  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: email,
    subject: isPasswordReset ? 'Reset Your Hymymom Pro Password' : 'Verify Your Hymymom Pro Account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0f172a; text-align: center;">${isPasswordReset ? 'Reset Your Password' : 'Welcome to Hymymom Pro'}</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">Hi ${name || 'there'},</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">${isPasswordReset ? 'You requested to reset your password. Please use the 6-digit code below:' : 'Thank you for joining our sanctuary. To complete your registration, please use the 6-digit verification code below:'}</p>
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3b82f6;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2024 Hymymom Pro. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}
