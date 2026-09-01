import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

function row(label, value) {
  return `<tr>
    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #5F6B7A; font-size: 13px; width: 120px; vertical-align: top;">${label}</td>
    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #1B2333; font-size: 14px;">${value}</td>
  </tr>`;
}

async function sendMailSafely(options) {
  if (!process.env.ADMIN_EMAIL || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('[server.js] Missing SMTP_EMAIL/SMTP_PASSWORD/ADMIN_EMAIL environment variables. Skipping email.');
    return;
  }
  try {
    await transporter.sendMail(options);
  } catch (err) {
    console.error('[server.js] Error sending email:', err.message);
  }
}

async function handleApiRequest(req, res, body) {
  const ts = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
  const adminEmail = process.env.ADMIN_EMAIL;

  if (req.url === '/api/submit-contact' || req.url === '/api/submit-form' || req.url === '/api/submit-enquiry' || req.url === '/api/submit-about') {
    const { full_name, name, email, phone, message, course_title, button_clicked } = body;
    const clientName = full_name || name || 'User';
    if (!email) return res.end(JSON.stringify({ error: 'Email is required' }));

    const adminHtml = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;">New Contact / Form Submission</h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Submitted on ${ts}</p>
      </div>
      <div style="padding:24px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          ${row('Name', clientName)}
          ${row('Email', email)}
          ${row('Phone', phone || '—')}
          ${course_title ? row('Course', course_title) : ''}
          ${button_clicked ? row('Action', button_clicked) : ''}
          ${message ? row('Message', message.replace(/\n/g, '<br>')) : ''}
        </table>
      </div>
    </div>`;

    const autoReplyHtml = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;">Thank You for Reaching Out</h1>
      </div>
      <div style="padding:24px 32px;">
        <p style="font-size:15px;color:#1B2333;">Hi ${clientName},</p>
        <p style="font-size:15px;color:#1B2333;">Thank you for contacting <strong>Marvel Slice</strong>. We have received your submission and our team will get back to you shortly.</p>
      </div>
    </div>`;

    await sendMailSafely({ from: `"Marvel Slice" <${process.env.SMTP_EMAIL}>`, to: adminEmail, subject: `New Inquiry from ${clientName}`, html: adminHtml });
    await sendMailSafely({ from: `"Marvel Slice" <${process.env.SMTP_EMAIL}>`, to: email, subject: 'Inquiry Received — Marvel Slice', html: autoReplyHtml });
    return res.end(JSON.stringify({ success: true }));
  }

  if (req.url === '/api/submit-banking') {
    const { full_name, email, phone, location, course_title } = body;
    if (!full_name || !email) return res.end(JSON.stringify({ error: 'Name and email are required' }));

    const adminHtml = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#0B2D6B;padding:24px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;">New Banking Course Enquiry</h1>
      </div>
      <div style="padding:24px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          ${row('Full Name', full_name)}
          ${row('Email', email)}
          ${row('Phone', phone || '—')}
          ${row('Location', location || '—')}
          ${row('Course', course_title || 'Banking & Finance Training')}
        </table>
      </div>
    </div>`;

    await sendMailSafely({ from: `"Marvel Banking" <${process.env.SMTP_EMAIL}>`, to: adminEmail, subject: `Banking Enquiry from ${full_name}`, html: adminHtml });
    return res.end(JSON.stringify({ success: true }));
  }

  return res.end(JSON.stringify({ success: true }));
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      let parsed = {};
      try { parsed = JSON.parse(body); } catch {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      await handleApiRequest(req, res, parsed);
    });
    return;
  }

  const distDir = path.join(__dirname, 'dist');
  let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`[Marvel Slice Production Docker Server] running on port ${PORT}`);
});
