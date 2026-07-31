import http from 'node:http';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const PORT = process.env.DEV_API_PORT || 3001;

function row(label, value) {
  return `<tr>
    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #5F6B7A; font-size: 13px; width: 120px; vertical-align: top;">${label}</td>
    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #1B2333; font-size: 14px;">${value}</td>
  </tr>`;
}

async function handleCareer(body) {
  const { full_name, email, phone, position, category, description, file_url } = body;
  if (!full_name || !email || !phone) return { success: true };
  if (!process.env.ADMIN_EMAIL || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return { success: true };

  const ts = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
  const fileLink = file_url ? `<a href="${file_url}" style="color: #1E56C7;">View Document</a>` : 'No file uploaded';

  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">New Career Application</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Submitted on ${ts}</p>
    </div>
    <div style="padding:24px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        ${row('Full Name', full_name)}${row('Email', email)}${row('Phone', phone)}${row('Position', position || '\u2014')}${row('Category', category || '\u2014')}${row('Description', (description || '\u2014').replace(/\n/g, '<br>'))}${row('Document', fileLink)}
      </table>
    </div>
    <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">Marvel Slice \u2014 Career Page</div>
  </div>`;
  const autoReplyHtml = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:22px;">Thank You for Your Application</h1></div>
    <div style="padding:24px 32px;">
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Hi ${full_name},</p>
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">We have received your application for the position you applied for at <strong>Marvel Slice</strong>.</p>
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Our team will review your profile and reach out to you shortly.</p>
      <div style="margin:24px 0;padding:16px 20px;background:#F5F6F8;border-radius:8px;font-size:13px;color:#5F6B7A;"><p style="margin:0 0 4px;">If you have any questions, feel free to reply to this email.</p></div>
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Best regards,<br/>The Marvel Slice Team</p>
    </div>
    <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">Marvel Slice</div>
  </div>`;

  try {
    await transporter.sendMail({ from: `"Marvel Careers" <${process.env.SMTP_EMAIL}>`, to: process.env.ADMIN_EMAIL, subject: `New Application from ${full_name}`, html });
    await transporter.sendMail({ from: `"Marvel Slice" <${process.env.SMTP_EMAIL}>`, to: email, subject: 'Application Received \u2014 Marvel Slice', html: autoReplyHtml });
    console.log('[dev-server] Career emails sent');
  } catch (err) { console.error('[dev-server] Career email failed:', err); }
  return { success: true };
}

async function handleForm(body) {
  const { full_name, email, phone } = body;
  if (!full_name || !email || !phone) return { success: true };
  if (!process.env.ADMIN_EMAIL || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return { success: true };

  const ts = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#74a916;padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">New Demo Request</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Submitted on ${ts}</p>
    </div>
    <div style="padding:24px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        ${row('Full Name', full_name)}${row('Email', email)}${row('Phone', phone)}
      </table>
    </div>
    <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">Marvel Slice \u2014 Home Page</div>
  </div>`;
  const autoReplyHtml = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#74a916;padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:22px;">Thank You for Your Interest</h1></div>
    <div style="padding:24px 32px;">
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Hi ${full_name},</p>
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Thank you for reaching out to <strong>Marvel Slice</strong>. We have received your demo request.</p>
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Our team will contact you shortly to schedule your free demo class.</p>
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Best regards,<br/>The Marvel Slice Team</p>
    </div>
    <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">Marvel Slice</div>
  </div>`;

  try {
    await transporter.sendMail({ from: `"Marvel Slice" <${process.env.SMTP_EMAIL}>`, to: process.env.ADMIN_EMAIL, subject: `New Demo Request from ${full_name}`, html });
    await transporter.sendMail({ from: `"Marvel Slice" <${process.env.SMTP_EMAIL}>`, to: email, subject: 'Demo Request Received \u2014 Marvel Slice', html: autoReplyHtml });
    console.log('[dev-server] Form emails sent');
  } catch (err) { console.error('[dev-server] Form email failed:', err); }
  return { success: true };
}

async function handleBrochure(body) {
  const { name, email, phone, course_title } = body;
  if (!name || !email) return { success: true };
  if (!process.env.ADMIN_EMAIL || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return { success: true };

  const ts = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">New Brochure Download Request</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Submitted on ${ts}</p>
    </div>
    <div style="padding:24px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        ${row('Name', name)}${row('Email', email)}${row('Phone', phone || '\u2014')}${row('Course', course_title || '\u2014')}
      </table>
    </div>
    <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">Marvel Slice \u2014 Course Page</div>
  </div>`;
  const autoReplyHtml = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:22px;">Brochure Request Received</h1></div>
    <div style="padding:24px 32px;">
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Hi ${name},</p>
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Thank you for your interest in <strong>${course_title || 'our course'}</strong> at Marvel Slice.</p>
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">We have received your brochure request. Please find the brochure attached to this email.</p>
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">If you have any questions, feel free to reply to this email or contact us directly.</p>
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Best regards,<br/>The Marvel Slice Team</p>
    </div>
    <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">Marvel Slice</div>
  </div>`;

  try {
    await transporter.sendMail({ from: `"Marvel Slice" <${process.env.SMTP_EMAIL}>`, to: process.env.ADMIN_EMAIL, subject: `Brochure Request from ${name}`, html });
    await transporter.sendMail({ from: `"Marvel Slice" <${process.env.SMTP_EMAIL}>`, to: email, subject: 'Brochure Request Received \u2014 Marvel Slice', html: autoReplyHtml });
    console.log('[dev-server] Brochure emails sent');
  } catch (err) { console.error('[dev-server] Brochure email failed:', err); }
  return { success: true };
}

async function handleContact(body) {
  const { full_name, email, phone, subject, message } = body;
  if (!full_name || !email) return { success: true };
  if (!process.env.ADMIN_EMAIL || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return { success: true };

  const ts = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">New Contact Request</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Submitted on ${ts}</p>
    </div>
    <div style="padding:24px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        ${row('Full Name', full_name)}${row('Email', email)}${row('Phone', phone || '\u2014')}${row('Subject', subject || '\u2014')}${row('Message', (message || '\u2014').replace(/\n/g, '<br>'))}
      </table>
    </div>
    <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">Marvel Slice — Contact Page</div>
  </div>`;
  const autoReplyHtml = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:22px;">Thank You for Contacting Us</h1></div>
    <div style="padding:24px 32px;">
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Hi ${full_name},</p>
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Thank you for reaching out to <strong>Marvel Slice</strong>. We have received your message.</p>
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Our team will review your inquiry and get back to you within 24 hours.</p>
      <div style="margin:24px 0;padding:16px 20px;background:#F5F6F8;border-radius:8px;font-size:13px;color:#5F6B7A;"><p style="margin:0 0 4px;">If you have any urgent questions, feel free to call us directly.</p></div>
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Best regards,<br/>The Marvel Slice Team</p>
    </div>
    <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">Marvel Slice</div>
  </div>`;

  try {
    await transporter.sendMail({ from: `"Marvel Slice" <${process.env.SMTP_EMAIL}>`, to: process.env.ADMIN_EMAIL, subject: `New Contact Request from ${full_name}`, html });
    await transporter.sendMail({ from: `"Marvel Slice" <${process.env.SMTP_EMAIL}>`, to: email, subject: 'Thank You for Contacting Us — Marvel Slice', html: autoReplyHtml });
    console.log('[dev-server] Contact emails sent');
  } catch (err) { console.error('[dev-server] Contact email failed:', err); }
  return { success: true };
}

async function handleAdminReply(body) {
  const { to_email, to_name, subject, message, type, attachment } = body;
  if (!to_email || !subject || !message) return { success: false, error: 'Missing required fields' };
  if (!process.env.ADMIN_EMAIL || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) return { success: true };

  let html = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">${subject}</h1>
    </div>
    <div style="padding:24px 32px;">
      <p style="font-size:15px;color:#1B2333;line-height:1.7;">Hi ${to_name},</p>
      <p style="font-size:15px;color:#1B2333;line-height:1.7;white-space:pre-wrap;">${message.replace(/\n/g, '<br>')}</p>`;

  if (type === 'brochure' && attachment?.courseTitle) {
    html += `<div style="margin:24px 0;padding:20px;background:#F5F6F8;border-radius:8px;border-left:4px solid #1E56C7;">
      <p style="margin:0 0 6px;font-size:13px;color:#5F6B7A;font-weight:600;">COURSE BROCHURE</p>
      <p style="margin:0;font-size:15px;color:#1B2333;font-weight:600;">${attachment.courseTitle}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#5F6B7A;">Please find the course brochure attached or visit our website for more details.</p>
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
      subject: subject,
      html,
    });
    console.log('[dev-server] Admin reply sent to', to_email);
  } catch (err) { console.error('[dev-server] Admin reply failed:', err); }
  return { success: true };
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || !req.url?.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', async () => {
    try {
      const parsed = JSON.parse(body);
      let result;
      if (req.url === '/api/submit-career') result = await handleCareer(parsed);
      else if (req.url === '/api/submit-form') result = await handleForm(parsed);
      else if (req.url === '/api/submit-brochure') result = await handleBrochure(parsed);
      else if (req.url === '/api/submit-contact') result = await handleContact(parsed);
      else if (req.url === '/api/admin-reply') result = await handleAdminReply(parsed);
      else { res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' })); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      console.error('[dev-server] Error:', err);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad request' }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`[dev-server] API server running on http://localhost:${PORT}`);
});
