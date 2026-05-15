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

export async function sendVisitReminderEmail(email, userName, familyName, visitTime, address) {
  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: email,
    subject: `Sanctuary Alert: Visit with ${familyName} Tomorrow`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f1f5f9; border-radius: 24px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 12px 24px; background-color: #f0f9ff; border-radius: 100px;">
            <span style="color: #0369a1; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Tomorrow's Sanctuary Visit</span>
          </div>
        </div>
        
        <h2 style="color: #0f172a; margin-top: 0; font-weight: 800; text-align: center; font-size: 24px;">Hi ${userName},</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
          This is a gentle reminder from your sanctuary. You have a scheduled visit tomorrow to support <strong>${familyName}</strong>.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 16px; padding: 24px; margin-bottom: 30px;">
          <div style="margin-bottom: 16px;">
            <p style="margin: 0; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em;">Time</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #0f172a;">${visitTime}</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em;">Location</p>
            <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #334155;">${address || 'Address provided in dashboard'}</p>
          </div>
        </div>

        <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: center;">
          Wishing you a meaningful and supportive session. Your presence makes all the difference.
        </p>
        
        <div style="text-align: center; margin-top: 40px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/visits" style="display: inline-block; padding: 14px 32px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 100px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">View Visit Details</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 40px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center;">
          You are receiving this because you enabled email reminders in your Practice Sanctuary settings.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}
