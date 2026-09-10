import nodemailer from 'nodemailer';

/**
 * Creates a Nodemailer Transporter configured for Webuzo / Webizo Mail System or Custom SMTP.
 * If process.env.SMTP_SERVICE is set (e.g. 'gmail'), it uses service mode.
 * Otherwise, it uses Webuzo Webmail / Custom SMTP (host, port 465/587, SSL/TLS, rejectUnauthorized: false).
 */
function createSmtpTransporter(user, pass) {
  if (process.env.SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: { user, pass },
    });
  }

  const defaultHost = user && user.includes('@') ? `mail.${user.split('@')[1]}` : 'localhost';
  const host = process.env.SMTP_HOST || defaultHost;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== 'false';

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Returns the General Webuzo / Webizo SMTP Transporter & Config
 * (Type 1: Contact, Banking, Courses, Demo, Admin Reply)
 */
export function getGeneralTransporter() {
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!user || !pass) {
    return null;
  }

  return {
    transporter: createSmtpTransporter(user, pass),
    user,
    adminEmail: adminEmail || user,
  };
}

/**
 * Returns the Career / Jobs & Internships Webuzo / Webizo SMTP Transporter & Config
 * (Type 2: Applications, Career Contact)
 */
export function getCareerTransporter() {
  const user =
    process.env.CAREER_SMTP_EMAIL ||
    process.env.JOB_SMTP_EMAIL ||
    process.env.JOBS_SMTP_EMAIL ||
    process.env.INTERN_SMTP_EMAIL ||
    process.env.SMTP_EMAIL;

  const pass =
    process.env.CAREER_SMTP_PASSWORD ||
    process.env.JOB_SMTP_PASSWORD ||
    process.env.JOBS_SMTP_PASSWORD ||
    process.env.INTERN_SMTP_PASSWORD ||
    process.env.SMTP_PASSWORD;

  const adminEmail =
    process.env.CAREER_ADMIN_EMAIL ||
    process.env.JOB_ADMIN_EMAIL ||
    process.env.JOBS_ADMIN_EMAIL ||
    process.env.INTERN_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    user;

  if (!user || !pass) {
    return null;
  }

  return {
    transporter: createSmtpTransporter(user, pass),
    user,
    adminEmail,
  };
}

/**
 * Sends mail safely without verbose logging
 */
export async function sendMailWithLogging(transporter, mailOptions) {
  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (err) {
    console.error('Email send failed:', err.message);
    return { success: false, error: err };
  }
}
