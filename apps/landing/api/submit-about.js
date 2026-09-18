import { getGeneralTransporter } from './lib/emailTransporters.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { full_name, email, phone, subject, message } = req.body;

  if (!full_name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const mailConfig = getGeneralTransporter();
  if (!mailConfig) {
    return res.status(200).json({ success: true });
  }

  const { transporter, user: smtpUser, adminEmail } = mailConfig;

  const submittedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  const enquirySubject = subject || 'General Enquiry';

  const adminSubject = `New Enquiry (${enquirySubject}) from ${full_name}`;
  const userSubject = `Enquiry Confirmation: ${enquirySubject} — Marvel Slice`;

  const adminHtml = `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;">New Enquiry Submission</h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Submitted on ${submittedAt}</p>
      </div>
      <div style="padding:24px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          ${row('Full Name', full_name)}
          ${row('Email', email)}
          ${row('Phone', phone || '—')}
          ${row('Subject', enquirySubject)}
          ${message ? row('Message', message.replace(/\n/g, '<br>')) : ''}
        </table>
      </div>
      <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">
        Marvel Slice
      </div>
    </div>`;

  const userAutoReplyHtml = `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;">Thank You for Reaching Out!</h1>
      </div>
      <div style="padding:24px 32px;">
        <p style="font-size:15px;color:#1B2333;line-height:1.7;">Hi ${full_name},</p>
        <p style="font-size:15px;color:#1B2333;line-height:1.7;">Thank you for contacting <strong>Marvel Slice</strong> regarding <strong>${enquirySubject}</strong>.</p>
        <p style="font-size:15px;color:#1B2333;line-height:1.7;">We have successfully received your message and our team will get back to you within 24 hours.</p>
        <p style="font-size:15px;color:#1B2333;line-height:1.7;">Best regards,<br/>The Marvel Slice Team</p>
      </div>
      <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">
        Marvel Slice
      </div>
    </div>`;

  try {
    await transporter.sendMail({
      from: `"Marvel Slice" <${smtpUser}>`,
      to: adminEmail,
      subject: adminSubject,
      html: adminHtml,
    });
    await transporter.sendMail({
      from: `"Marvel Slice" <${smtpUser}>`,
      to: email,
      subject: userSubject,
      html: userAutoReplyHtml,
    });
  } catch (emailError) {
    console.error('Submit-about email send failed:', emailError);
  }

  return res.status(200).json({ success: true });
}

function row(label, value) {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#5F6B7A;font-size:13px;width:120px;vertical-align:top;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#1B2333;font-size:14px;">${value}</td>
  </tr>`;
}
