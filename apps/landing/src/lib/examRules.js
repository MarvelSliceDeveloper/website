// Shared default exam rules for custom mock exams.
//
// The admin can edit these per exam in the exam editor ("Exam Rules &
// Guidelines Text"). When left untouched/empty, this default is used
// everywhere automatically — candidates always see these 10 rules and
// saving an exam with a blank rules box stores this default instead.

export const DEFAULT_EXAM_RULES_TEXT =
  '1. Stay on the official exam website with a stable internet connection throughout the test.\n' +
  '2. Do not refresh, close, or leave the exam page while the test is running.\n' +
  '3. Do not switch browser tabs or windows — tab switches are tracked and reported.\n' +
  '4. Do not leak, share, screenshot, or distribute any exam questions or content.\n' +
  '5. Do not use unauthorized materials, devices, or external assistance during the exam.\n' +
  '6. Each question carries 1 mark with no negative marking.\n' +
  '7. Read each question carefully before selecting your answer.\n' +
  '8. Manage your time effectively and attempt all questions within the given duration.\n' +
  '9. Review your answers and marked questions before final submit, if time permits.\n' +
  '10. The exam auto-submits when the timer expires; once submitted, answers cannot be changed.';

// Returns the exam's own rules when the admin edited them,
// otherwise the shared default (never blank, never hardcoded per page).
export function getExamRulesText(exam) {
  const custom = (exam?.rules_text || '').trim();
  return custom || DEFAULT_EXAM_RULES_TEXT;
}
