import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to_email, to_name, subject, message, type, attachment } = req.body;

  if (!to_email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!process.env.ADMIN_EMAIL || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    return res.status(200).json({ success: true });
  }

  let html = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">${subject}</h1>
    </div>
    <div style="padding:24px 32px;">
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Hi ${to_name},</p>
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">${message.replace(/\n/g, '<br>')}</p>`;

  if (type === 'brochure' && attachment?.courseTitle) {
    html += `<div style="margin:24px 0;padding:20px;background:#F5F6F8;border-radius:8px;border-left:4px solid #1E56C7;">
      <p style="margin:0 0 6px;font-size:13px;color:#5F6B7A;font-weight:600;">COURSE BROCHURE</p>
      <p style="margin:0;font-size:15px;color:#1B2333;font-weight:600;">${attachment.courseTitle}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#5F6B7A;">Please visit our website for more details.</p>
    </div>`;
  } else if (type === 'brochure' && attachment?.url) {
    html += `<div style="margin:24px 0;padding:20px;background:#F5F6F8;border-radius:8px;border-left:4px solid #1E56C7;">
      <p style="margin:0 0 6px;font-size:13px;color:#5F6B7A;font-weight:600;">ATTACHED DOCUMENT</p>
      <a href="${attachment.url}" style="display:inline-block;padding:10px 20px;background:#1E56C7;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">Download Brochure</a>
    </div>`;
  }

  html += `<p style="font-size:15px;color:#1B2333;line-height:1.7;">Best regards,<br/>The Marvel Slice Team</p>
    </div>
    <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">Marvel Slice</div>
  </div>`;

  try {
    await transporter.sendMail({
      from: `"Marvel Slice" <${process.env.SMTP_EMAIL}>`,
      to: to_email,
      subject,
      html,
    });
  } catch (emailError) {
    console.error('Admin reply email failed:', emailError);
  }

  return res.status(200).json({ success: true });
}
