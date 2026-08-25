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

  const { full_name, email, phone, enquiry_type, topic_title, button_clicked } = req.body;

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

  const topicName = topic_title || 'General Banking Enquiry';
  const enquiryCategory = enquiry_type === 'topic' ? 'Topic-Specific Enquiry' : 'General Banking CTA';

  const adminSubject = `New Banking Enquiry (${topicName}) from ${full_name}`;
  const userSubject = `Banking Enquiry Confirmation: ${topicName} — Marvel Slice`;

  const adminHtml = `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#0B2A6F,#1558D6);padding:24px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;">New Banking Enquiry</h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Submitted on ${submittedAt}</p>
      </div>
      <div style="padding:24px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          ${row('Full Name', full_name)}
          ${row('Email', email)}
          ${row('Phone', phone || '—')}
          ${row('Enquiry Type', enquiryCategory)}
          ${row('Exam / Topic', topicName)}
          ${row('Button Action', button_clicked || 'Enquire Now')}
        </table>
      </div>
      <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">
        Marvel Slice Banking Careers
      </div>
    </div>`;

  const userAutoReplyHtml = `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#0B2A6F,#1558D6);padding:24px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;">Banking Enquiry Received!</h1>
      </div>
      <div style="padding:24px 32px;">
        <p style="font-size:15px;color:#1B2333;line-height:1.7;">Hi ${full_name},</p>
        <p style="font-size:15px;color:#1B2333;line-height:1.7;">Thank you for your enquiry regarding <strong>${topicName}</strong> at <strong>Marvel Slice</strong>.</p>
        <div style="margin:24px 0;padding:16px 20px;background:#F0F6FF;border-radius:8px;font-size:13px;color:#0B2A6F;">
          <p style="margin:0 0 4px;font-weight:700;">What happens next?</p>
          <p style="margin:0;">Our specialized banking exam advisors will review your details and reach out to you at <strong>${phone || email}</strong> shortly with exam preparation strategies, syllabus guides, and batch details.</p>
        </div>
        <p style="font-size:15px;color:#1B2333;line-height:1.7;">Best regards,<br/>The Marvel Slice Competitive Exam Team</p>
      </div>
      <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">
        Marvel Slice
      </div>
    </div>`;

  try {
    await transporter.sendMail({
      from: `"Marvel Slice Banking" <${process.env.SMTP_EMAIL}>`,
      to: adminEmail,
      subject: adminSubject,
      html: adminHtml,
    });
    await transporter.sendMail({
      from: `"Marvel Slice Banking" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: userSubject,
      html: userAutoReplyHtml,
    });
  } catch (emailError) {
    console.error('Banking email send failed:', emailError);
  }

  return res.status(200).json({ success: true });
}

function row(label, value) {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#5F6B7A;font-size:13px;width:130px;vertical-align:top;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#1B2333;font-size:14px;font-weight:500;">${value}</td>
  </tr>`;
}
