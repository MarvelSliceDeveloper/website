import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const env = parseEnv(readFileSync(path.join(root, '.env'), 'utf8'));

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([\w]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

async function main() {
  // 1. Check the table exists (read-only HEAD/count).
  const head = await fetch(`${url}/rest/v1/legal_pages?select=page_key&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (head.status !== 200) {
    console.log(`TABLE_NOT_FOUND (${head.status}): ${await head.text()}`);
    console.log('The `legal_pages` table does not exist in the remote DB.');
    console.log('Run these migrations first via the Supabase SQL editor (with DB/owner privileges, which the anon key cannot do):');
    console.log('  1. supabase/migrations/legal_pages.sql');
    console.log('  2. supabase/migrations/seed_terms.sql');
    return;
  }

  // Table exists — seed via REST upsert on the unique page_key.
  for (const row of [buildTermsRow(), buildPrivacyRow()]) {
    const res = await fetch(`${url}/rest/v1/legal_pages?on_conflict=page_key`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(row),
    });
    console.log(`SEED ${row.page_key}: ${res.status}`);
    const text = await res.text();
    if (text) console.log(text);
  }
}

function buildTermsRow() {
  const section = (id, heading, body) =>
    ({ id, heading, body, heading_align: 'left', body_align: 'left' });
  return {
    page_key: 'terms',
    title: 'Terms and Conditions',
    intro: 'These Terms and Conditions ("Terms") form a binding agreement between you and Marvel Slice ("we", "us", "our"). By accessing or using our website at marvelslice.com (the "Site") or any courses, training services, or content we provide, you agree to be bound by these Terms. If you do not agree, please do not use the Site.',
    sections: [
      section('intro-1', '1. Introduction', "These Terms govern your use of the Site and all services offered by Marvel Slice, including software learning courses, competitive exam preparation, training programs, and any associated content, materials, and communications. These Terms are effective as of August 5, 2026. By registering, purchasing, or otherwise using our services, you accept these Terms and our Privacy Policy."),
      section('sec-2', '2. Interpretation', "A reference to a party includes that party's successors and permitted assigns. Headings in these Terms are for convenience only and do not affect interpretation. The singular includes the plural and vice versa."),
      section('sec-3', '3. Eligibility', "To use our services you must be at least 18 years of age and capable of entering into a legally binding contract. If you are under 18, you may use the Site only with the consent of a parent or guardian."),
      section('sec-4', '4. Accounts', "You are responsible for all activity under your account and for keeping your login credentials confidential. You agree to notify us immediately of any unauthorized use. We reserve the right to suspend or terminate accounts that violate these Terms."),
      section('sec-5', '5. Intellectual Property', "All content on the Site, including course materials, text, graphics, logos, and software, is the property of Marvel Slice or its licensors and is protected by applicable intellectual property laws. You may not copy, reproduce, distribute, or create derivative works from our content without prior written permission."),
      section('sec-6', '6. Acceptable Use', "You agree not to misuse the Site, attempt to gain unauthorized access, interfere with its operation, or use it for any unlawful purpose. You may not upload malicious content, collect user data without consent, or engage in any activity that disrupts our services."),
      section('sec-7', '7. Payments and Refunds', "Fees for courses and services are stated on the Site. Unless otherwise indicated, payments are due in advance and are non-refundable except as required by applicable law or as set out in our refund policy. We reserve the right to change pricing at any time."),
      section('sec-8', '8. Third-Party Links', "The Site may contain links to third-party websites. We are not responsible for the content, policies, or practices of any third-party sites. Your use of such links is at your own risk."),
      section('sec-9', '9. Disclaimers', 'The Site and our services are provided "as is" and "as available" without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Site will be uninterrupted or error-free.'),
      section('sec-10', '10. Limitation of Liability', "To the maximum extent permitted by law, Marvel Slice shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, arising out of your use of the Site or our services."),
      section('sec-11', '11. Indemnification', "You agree to indemnify and hold harmless Marvel Slice and its employees, contractors, and agents from any claims, damages, liabilities, and expenses (including legal fees) arising out of your use of the Site or violation of these Terms."),
      section('sec-12', '12. Termination', "We may terminate or suspend your access to the Site and services, in whole or in part, at any time with or without notice, if you breach these Terms or for any other reason we deem appropriate."),
      section('sec-13', '13. Governing Law', "These Terms are governed by and construed in accordance with the laws of the State of [State], without regard to its conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of the courts located in [County], [State]."),
      section('sec-14', '14. DMCA / Copyright', "Marvel Slice respects the intellectual property rights of others. If you believe that any material on the Site infringes your copyright, please contact our designated agent: Marvel Slice Support, support@marvelslice.com. We will respond to valid takedown notices in accordance with applicable law."),
      section('sec-15', '15. Changes to These Terms', "We may update these Terms from time to time. The latest version will always be posted on this page with the effective date shown below. Your continued use of the Site after changes are posted constitutes acceptance of the revised Terms."),
      section('sec-16', '16. Contact Us', "If you have any questions about these Terms, you may contact us at Marvel Slice, [Mailing Address], [City, County, State], or by email at support@marvelslice.com."),
    ],
    is_published: true,
  };
}

function buildPrivacyRow() {
  const section = (id, heading, body) =>
    ({ id, heading, body, heading_align: 'left', body_align: 'left' });
  return {
    page_key: 'privacy',
    title: 'Privacy Policy',
    intro: 'This Privacy Policy explains how Marvel Slice ("we", "us", "our") collects, uses, and protects your personal information when you use our website at marvelslice.com (the "Site") and our services. This policy is effective as of August 5, 2026.',
    sections: [
      section('priv-1', '1. Information We Collect', "We collect information you provide directly, such as your name, email address, phone number, and any details submitted through our forms, applications, or bookings. We also collect certain information automatically, including your IP address, browser type, device information, and usage data."),
      section('priv-2', '2. How We Use Your Information', "We use the information we collect to provide and improve our services, process enquiries and applications, communicate with you, personalize your experience, send relevant updates and marketing (where you have consented), and comply with legal obligations."),
      section('priv-3', '3. Cookies and Tracking', "We may use cookies and similar technologies to remember your preferences, analyze site traffic, and understand how visitors use our Site. You can control cookies through your browser settings, but disabling them may affect certain features."),
      section('priv-4', '4. Sharing of Information', "We do not sell your personal information. We may share your information with trusted service providers who help us operate the Site and deliver our services, and only to the extent necessary to perform those functions. We may also disclose information where required by law or to protect our rights."),
      section('priv-5', '5. Data Security', "We take reasonable measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security."),
      section('priv-6', '6. Data Retention', "We retain your personal information only for as long as necessary to fulfill the purposes described in this policy, comply with our legal obligations, resolve disputes, and enforce our agreements."),
      section('priv-7', '7. Your Rights', "Depending on your location, you may have the right to access, correct, update, or delete your personal information, and to object to or restrict certain processing. To exercise these rights, please contact us using the details below."),
      section('priv-8', "8. Children's Privacy", "Our services are not directed to children under 13, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will take steps to remove it."),
      section('priv-9', '9. Third-Party Links', "The Site may contain links to third-party websites. We are not responsible for the privacy practices of those sites, and we encourage you to review their privacy policies."),
      section('priv-10', '10. Changes to This Policy', "We may update this Privacy Policy from time to time. The latest version will always be posted on this page with the effective date shown above. Your continued use of the Site after changes are posted constitutes acceptance of the revised policy."),
      section('priv-11', '11. Contact Us', "If you have any questions about this Privacy Policy or how we handle your information, you may contact us at Marvel Slice, [Mailing Address], [City, County, State], or by email at support@marvelslice.com."),
    ],
    is_published: true,
  };
}

main();