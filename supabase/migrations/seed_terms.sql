-- Seed initial Terms & Conditions content.
-- This is a starting template built on the real branding details requested
-- (Marvel Slice / marvelslice.com). Review and edit every clause in the admin
-- editor (Admin > All Pages > Terms & Conditions) before going live.

insert into legal_pages (page_key, title, intro, sections, is_published)
values (
  'terms',
  'Terms and Conditions',
  'These Terms and Conditions ("Terms") form a binding agreement between you and Marvel Slice ("we", "us", "our"). By accessing or using our website at marvelslice.com (the "Site") or any courses, training services, or content we provide, you agree to be bound by these Terms. If you do not agree, please do not use the Site.',
  jsonb_build_array(
    jsonb_build_object('id', 'intro-1', 'heading', '1. Introduction', 'body',
      'These Terms govern your use of the Site and all services offered by Marvel Slice, including software learning courses, competitive exam preparation, training programs, and any associated content, materials, and communications. These Terms are effective as of August 5, 2026. By registering, purchasing, or otherwise using our services, you accept these Terms and our Privacy Policy.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', 'sec-2', 'heading', '2. Interpretation', 'body',
      'A reference to a party includes that party''s successors and permitted assigns. Headings in these Terms are for convenience only and do not affect interpretation. The singular includes the plural and vice versa.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', 'sec-3', 'heading', '3. Eligibility', 'body',
      'To use our services you must be at least 18 years of age and capable of entering into a legally binding contract. If you are under 18, you may use the Site only with the consent of a parent or guardian.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', 'sec-4', 'heading', '4. Accounts', 'body',
      'You are responsible for all activity under your account and for keeping your login credentials confidential. You agree to notify us immediately of any unauthorized use. We reserve the right to suspend or terminate accounts that violate these Terms.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', 'sec-5', 'heading', '5. Intellectual Property', 'body',
      'All content on the Site, including course materials, text, graphics, logos, and software, is the property of Marvel Slice or its licensors and is protected by applicable intellectual property laws. You may not copy, reproduce, distribute, or create derivative works from our content without prior written permission.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', 'sec-6', 'heading', '6. Acceptable Use', 'body',
      'You agree not to misuse the Site, attempt to gain unauthorized access, interfere with its operation, or use it for any unlawful purpose. You may not upload malicious content, collect user data without consent, or engage in any activity that disrupts our services.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', 'sec-7', 'heading', '7. Payments and Refunds', 'body',
      'Fees for courses and services are stated on the Site. Unless otherwise indicated, payments are due in advance and are non-refundable except as required by applicable law or as set out in our refund policy. We reserve the right to change pricing at any time.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', 'sec-8', 'heading', '8. Third-Party Links', 'body',
      'The Site may contain links to third-party websites. We are not responsible for the content, policies, or practices of any third-party sites. Your use of such links is at your own risk.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', 'sec-9', 'heading', '9. Disclaimers', 'body',
      'The Site and our services are provided "as is" and "as available" without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Site will be uninterrupted or error-free.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', 'sec-10', 'heading', '10. Limitation of Liability', 'body',
      'To the maximum extent permitted by law, Marvel Slice shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, arising out of your use of the Site or our services.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', 'sec-11', 'heading', '11. Indemnification', 'body',
      'You agree to indemnify and hold harmless Marvel Slice and its employees, contractors, and agents from any claims, damages, liabilities, and expenses (including legal fees) arising out of your use of the Site or violation of these Terms.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', 'sec-12', 'heading', '12. Termination', 'body',
      'We may terminate or suspend your access to the Site and services, in whole or in part, at any time with or without notice, if you breach these Terms or for any other reason we deem appropriate.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', 'sec-13', 'heading', '13. Governing Law', 'body',
      'These Terms are governed by and construed in accordance with the laws of the State of [State], without regard to its conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of the courts located in [County], [State].', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', 'sec-14', 'heading', '14. DMCA / Copyright', 'body',
      'Marvel Slice respects the intellectual property rights of others. If you believe that any material on the Site infringes your copyright, please contact our designated agent: Marvel Slice Support, support@marvelslice.com. We will respond to valid takedown notices in accordance with applicable law.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', 'sec-15', 'heading', '15. Changes to These Terms', 'body',
      'We may update these Terms from time to time. The latest version will always be posted on this page with the effective date shown below. Your continued use of the Site after changes are posted constitutes acceptance of the revised Terms.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', 'sec-16', 'heading', '16. Contact Us', 'body',
      'If you have any questions about these Terms, you may contact us at Marvel Slice, [Mailing Address], [City, County, State], or by email at support@marvelslice.com.', 'heading_align', 'left', 'body_align', 'left')
  ),
  true
)
on conflict (page_key) do nothing;