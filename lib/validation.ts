export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateFullName(fullName: string): ValidationResult {
  const errors: string[] = []

  if (!fullName || fullName.trim().length === 0) {
    errors.push("Ad soyad gereklidir")
  } else if (fullName.trim().length < 2) {
    errors.push("Ad soyad en az 2 karakter olmalıdır")
  } else if (fullName.trim().length > 100) {
    errors.push("Ad soyad 100 karakterden uzun olamaz")
  } else if (!/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(fullName.trim())) {
    errors.push("Ad soyad sadece harf ve boşluk içerebilir")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = []
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email || email.trim().length === 0) {
    errors.push("E-posta adresi gereklidir")
  } else if (!emailRegex.test(email.trim())) {
    errors.push("Geçerli bir e-posta adresi girin")
  } else if (email.trim().length > 254) {
    errors.push("E-posta adresi çok uzun")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = []

  if (!password) {
    errors.push("Şifre gereklidir")
  } else {
    if (password.length < 8) {
      errors.push("Şifre en az 8 karakter olmalıdır")
    }
    if (password.length > 128) {
      errors.push("Şifre 128 karakterden uzun olamaz")
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Şifre en az bir küçük harf içermelidir")
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Şifre en az bir büyük harf içermelidir")
    }
    if (!/\d/.test(password)) {
      errors.push("Şifre en az bir rakam içermelidir")
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validatePasswordConfirmation(password: string, confirmPassword: string): ValidationResult {
  const errors: string[] = []

  if (!confirmPassword) {
    errors.push("Şifre doğrulaması gereklidir")
  } else if (password !== confirmPassword) {
    errors.push("Şifreler eşleşmiyor")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
