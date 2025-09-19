/**
 * Email obfuscation utilities for privacy protection
 */

// Base64 encoding for email obfuscation
export const obfuscateEmail = (email: string): string => {
  return btoa(email);
};

export const deobfuscateEmail = (obfuscatedEmail: string): string => {
  try {
    return atob(obfuscatedEmail);
  } catch {
    return 'contact@example.com'; // Fallback
  }
};

// ROT13 encoding as additional layer
export const rot13 = (str: string): string => {
  return str.replace(/[a-zA-Z]/g, (char) => {
    const start = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - start + 13) % 26) + start);
  });
};

// Split email into parts for dynamic reconstruction
export const splitEmail = (email: string): { user: string; domain: string } => {
  const [user, domain] = email.split('@');
  return { 
    user: obfuscateEmail(user), 
    domain: obfuscateEmail(domain) 
  };
};

export const reconstructEmail = (user: string, domain: string): string => {
  return `${deobfuscateEmail(user)}@${deobfuscateEmail(domain)}`;
};

// Dynamic email display component data
export const getObfuscatedEmailData = () => {
  const email = 'chris@cloudcodetree.com';
  const { user, domain } = splitEmail(email);
  
  return {
    user,
    domain,
    display: 'chris [at] cloudcodetree [dot] com',
    fullEmail: email
  };
};