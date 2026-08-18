const validateRequired = (value, fieldName) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${fieldName} maydoni to'ldirilishi shart.`;
  }
  return null;
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(String(email).toLowerCase())) {
    return "Yaroqsiz elektron pochta manzili.";
  }
  return null;
};

const validateUrl = (url) => {
  if (!url) return null;
  try {
    new URL(url);
    return null;
  } catch (err) {
    return "Yaroqsiz URL manzili.";
  }
};

const validateStringLength = (value, min, max, fieldName) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  if (str.length < min || str.length > max) {
    return `${fieldName} maydoni ${min} dan ${max} gacha belgidan iborat bo'lishi kerak.`;
  }
  return null;
};

const validateEnum = (value, allowed, fieldName) => {
  if (value === undefined || value === null) return null;
  if (!allowed.includes(value)) {
    return `${fieldName} maydoni noto'g'ri qiymatga ega.`;
  }
  return null;
};

const validateUUID = (value) => {
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!re.test(value)) {
    return "Yaroqsiz identifikator (UUID).";
  }
  return null;
};

const validateDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return "Yaroqsiz sana formati.";
  }
  return null;
};

module.exports = {
  validateRequired,
  validateEmail,
  validateUrl,
  validateStringLength,
  validateEnum,
  validateUUID,
  validateDate
};
