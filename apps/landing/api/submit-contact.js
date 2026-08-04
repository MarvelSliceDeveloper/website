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

  const { full_name, email, phone, subject, message } = req.body;

  if (!full_name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    return res.status(200).json({ success: true });
  }

  const submittedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  const adminHtml = `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;">New Contact Request</h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Submitted on ${submittedAt}</p>
      </div>
      <div style="padding:24px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          ${row('Full Name', full_name)}
          ${row('Email', email)}
          ${row('Phone', phone || '\u2014')}
          ${row('Subject', subject || '\u2014')}
          ${row('Message', (message || '\u2014').replace(/\n/g, '<br>'))}
        </table>
      </div>
      <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">
        Marvel Slice — Contact Page
      </div>
    </div>`;

  const autoReplyHtml = `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;">Thank You for Contacting Us</h1>
      </div>
      <div style="padding:24px 32px;">
        <p style="font-size:15px;color:#1B2333;line-height:1.7;">Hi ${full_name},</p>
        <p style="font-size:15px;color:#1B2333;line-height:1.7;">Thank you for reaching out to <strong>Marvel Slice</strong>. We have received your message.</p>
        <p style="font-size:15px;color:#1B2333;line-height:1.7;">Our team will review your inquiry and get back to you within 24 hours.</p>
        <div style="margin:24px 0;padding:16px 20px;background:#F5F6F8;border-radius:8px;font-size:13px;color:#5F6B7A;">
          <p style="margin:0 0 4px;">If you have any urgent questions, feel free to call us directly.</p>
        </div>
        <p style="font-size:15px;color:#1B2333;line-height:1.7;">Best regards,<br/>The Marvel Slice Team</p>
      </div>
      <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">
        Marvel Slice
      </div>
    </div>`;

  try {
    await transporter.sendMail({
      from: `"Marvel Slice" <${process.env.SMTP_EMAIL}>`,
      to: adminEmail,
      subject: `New Contact Request from ${full_name}`,
      html: adminHtml,
    });
    await transporter.sendMail({
      from: `"Marvel Slice" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Thank You for Contacting Us — Marvel Slice',
      html: autoReplyHtml,
    });
  } catch (emailError) {
    console.error('Contact email send failed:', emailError);
  }

  return res.status(200).json({ success: true });
}

function row(label, value) {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#5F6B7A;font-size:13px;width:120px;vertical-align:top;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#1B2333;font-size:14px;">${value}</td>
  </tr>`;
}
