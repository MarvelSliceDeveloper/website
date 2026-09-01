// Strong Password Validator implementing all 8 security rules:
// 1. Minimum 8 characters (preferably 12+)
// 2. At least 1 uppercase letter (A-Z)
// 3. At least 1 lowercase letter (a-z)
// 4. At least 1 number (0-9)
// 5. At least 1 special character (@#$%^&*!)
// 6. No spaces
// 7. Should not contain common passwords like Password123
// 8. Should not contain the user's name/email

const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '12345678', '123456789', '12345',
  'admin', 'admin123', 'administrator', 'welcome', 'welcome123', 'marvel123',
  'qwerty', 'letmein', 'pass123', 'password@123', 'p@ssword', 'p@ssword123',
  'iloveyou', 'sunshine', 'princess', 'dragon', 'master', 'monkey'
];

export function validateStrongPassword(val, userInfo = {}) {
  if (!val) return 'Password is required.';

  // 1. Minimum 8 characters
  if (val.length < 8) {
    return 'Password must be at least 8 characters long (preferably 12+).';
  }

  // 2. No spaces
  if (/\s/.test(val)) {
    return 'Password cannot contain spaces.';
  }

  // 3. At least 1 uppercase letter (A-Z)
  if (!/[A-Z]/.test(val)) {
    return 'Password must contain at least 1 uppercase letter (A-Z).';
  }

  // 4. At least 1 lowercase letter (a-z)
  if (!/[a-z]/.test(val)) {
    return 'Password must contain at least 1 lowercase letter (a-z).';
  }

  // 5. At least 1 number (0-9)
  if (!/[0-9]/.test(val)) {
    return 'Password must contain at least 1 number (0-9).';
  }

  // 6. At least 1 special character (@#$%^&*!)
  if (!/[@#$%^&*!_\-+=\[\]{}|;:,.<>?/~`]/.test(val)) {
    return 'Password must contain at least 1 special character (@#$%^&*!).';
  }

  // 7. Should not contain common passwords
  const lowerVal = val.toLowerCase();
  for (const common of COMMON_PASSWORDS) {
    if (lowerVal.includes(common)) {
      return 'Password is too common or easily guessable. Please choose a unique password.';
    }
  }

  // 8. Should not contain user's name or email
  const { name = '', email = '' } = userInfo;
  const tokens = [];

  if (email && typeof email === 'string') {
    const emailPrefix = email.split('@')[0].toLowerCase();
    if (emailPrefix.length >= 3) {
      tokens.push(emailPrefix);
      emailPrefix.split(/[._\-+]/).forEach((part) => {
        if (part.length >= 3) tokens.push(part);
      });
    }
  }

  if (name && typeof name === 'string') {
    name.toLowerCase().split(/\s+/).forEach((part) => {
      if (part.length >= 3) tokens.push(part);
    });
  }

  for (const token of tokens) {
    if (lowerVal.includes(token)) {
      return 'Password should not contain your name or email address.';
    }
  }

  return '';
}

export function getPasswordRequirementsList(val, userInfo = {}) {
  const { name = '', email = '' } = userInfo;
  const lowerVal = (val || '').toLowerCase();

  const isMinLength = (val || '').length >= 8;
  const hasUpper = /[A-Z]/.test(val || '');
  const hasLower = /[a-z]/.test(val || '');
  const hasNum = /[0-9]/.test(val || '');
  const hasSpecial = /[@#$%^&*!_\-+=\[\]{}|;:,.<>?/~`]/.test(val || '');
  const noSpace = !/\s/.test(val || '') && (val || '').length > 0;
  const notCommon = !COMMON_PASSWORDS.some((common) => lowerVal.includes(common));

  let notPersonal = true;
  if (email || name) {
    const tokens = [];
    if (email) {
      const emailPrefix = email.split('@')[0].toLowerCase();
      if (emailPrefix.length >= 3) tokens.push(emailPrefix);
    }
    if (name) {
      name.toLowerCase().split(/\s+/).forEach((part) => {
        if (part.length >= 3) tokens.push(part);
      });
    }
    notPersonal = !tokens.some((token) => lowerVal.includes(token));
  }

  return [
    { label: 'At least 8 characters (preferably 12+)', met: isMinLength },
    { label: 'At least 1 uppercase letter (A-Z)', met: hasUpper },
    { label: 'At least 1 lowercase letter (a-z)', met: hasLower },
    { label: 'At least 1 number (0-9)', met: hasNum },
    { label: 'At least 1 special character (@#$%^&*!)', met: hasSpecial },
    { label: 'No spaces', met: noSpace },
    { label: 'Not a common password (e.g. Password123)', met: notCommon },
    { label: 'Does not contain your name or email', met: notPersonal },
  ];
}
