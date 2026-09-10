import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { fetchAndStoreCurrentAffairs } from './src/lib/rssService.js';
import { getGeneralTransporter, getCareerTransporter } from './api/lib/emailTransporters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;

function row(label, value) {
  return `<tr>
    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #5F6B7A; font-size: 13px; width: 120px; vertical-align: top;">${label}</td>
    <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #1B2333; font-size: 14px;">${value}</td>
  </tr>`;
}

async function handleApiRequest(req, res, body) {
  const ts = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' });

  if (req.url === '/api/submit-career' || req.url === '/api/submit-career-contact') {
    const careerConfig = getCareerTransporter();
    if (!careerConfig) return res.end(JSON.stringify({ success: true }));

    const { transporter, user: smtpUser, adminEmail } = careerConfig;
    const { full_name, email, phone, position, category, description, file_url } = body;
    if (!full_name || !email) return res.end(JSON.stringify({ error: 'Name and email are required' }));

    const fileLink = file_url ? `<a href="${file_url}" target="_blank" style="color: #1E56C7;">View Document</a>` : 'No file uploaded';

    const adminHtml = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;">${req.url === '/api/submit-career' ? 'New Career Application' : 'New Career Contact Request'}</h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Submitted on ${ts}</p>
      </div>
      <div style="padding:24px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          ${row('Full Name', full_name)}
          ${row('Email', email)}
          ${row('Phone', phone || '—')}
          ${position ? row('Position', position) : ''}
          ${category ? row('Category', category) : ''}
          ${description ? row('Description', description.replace(/\n/g, '<br>')) : ''}
          ${file_url ? row('Document', fileLink) : ''}
        </table>
      </div>
      <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">Marvel Slice — Career Page</div>
    </div>`;

    const autoReplyHtml = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#0B2D6B,#1E56C7);padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:22px;">Thank You for Reaching Out</h1></div>
      <div style="padding:24px 32px;">
        <p style="font-size:15px;color:#1B2333;">Hi ${full_name},</p>
        <p style="font-size:15px;color:#1B2333;">Thank you for reaching out to <strong>Marvel Slice</strong>. We have received your application/details and our team will get back to you shortly.</p>
      </div>
      <div style="padding:16px 32px;background:#F5F6F8;font-size:12px;color:#5F6B7A;text-align:center;border-top:1px solid #e5e7eb;">Marvel Slice</div>
    </div>`;

    try {
      await transporter.sendMail({ from: `"Marvel Careers" <${smtpUser}>`, to: adminEmail, subject: `New Career Request from ${full_name}`, html: adminHtml });
      await transporter.sendMail({ from: `"Marvel Careers" <${smtpUser}>`, to: email, subject: 'Thank You for Reaching Out — Marvel Slice', html: autoReplyHtml });
    } catch (err) {
      console.error('[server.js] Error sending career email:', err.message);
    }
    return res.end(JSON.stringify({ success: true }));
  }

  const generalConfig = getGeneralTransporter();
  if (!generalConfig) return res.end(JSON.stringify({ success: true }));
  const { transporter, user: smtpUser, adminEmail } = generalConfig;

  if (req.url === '/api/submit-contact' || req.url === '/api/submit-form' || req.url === '/api/submit-enquiry' || req.url === '/api/submit-about') {
    const { full_name, name, email, phone, role, message, course_title, button_clicked } = body;
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
          ${role ? row('Role', role) : ''}
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
        ${role ? `<p style="font-size:14px;color:#0B2D6B;line-height:1.6;background:#f0f6ff;padding:12px 16px;border-radius:8px;margin:16px 0;">Registered Role / Profile: <strong>${role}</strong></p>` : ''}
      </div>
    </div>`;

    try {
      await transporter.sendMail({ from: `"Marvel Slice" <${smtpUser}>`, to: adminEmail, subject: `New Inquiry from ${clientName}`, html: adminHtml });
      await transporter.sendMail({ from: `"Marvel Slice" <${smtpUser}>`, to: email, subject: 'Inquiry Received — Marvel Slice', html: autoReplyHtml });
    } catch (err) {
      console.error('[server.js] Error sending contact email:', err.message);
    }
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

    try {
      await transporter.sendMail({ from: `"Marvel Banking" <${smtpUser}>`, to: adminEmail, subject: `Banking Enquiry from ${full_name}`, html: adminHtml });
    } catch (err) {
      console.error('[server.js] Error sending banking email:', err.message);
    }
    return res.end(JSON.stringify({ success: true }));
  }

  if (req.url === '/api/fetch-current-affairs') {
    const result = await fetchAndStoreCurrentAffairs();
    return res.end(JSON.stringify(result));
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
  
  // Automated 3-hour Current Affairs RSS Sync
  const THREE_HOURS = 3 * 60 * 60 * 1000;
  setTimeout(() => {
    fetchAndStoreCurrentAffairs().catch((e) => console.error('[server.js] Initial RSS fetch error:', e));
  }, 5000);
  setInterval(() => {
    fetchAndStoreCurrentAffairs().catch((e) => console.error('[server.js] Scheduled RSS fetch error:', e));
  }, THREE_HOURS);
});
