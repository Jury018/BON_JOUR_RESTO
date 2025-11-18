// Toggle both sign-up password fields
function toggleSignUpPasswords() {
  const pw1 = document.getElementById('signUpPassword');
  const pw2 = document.getElementById('confirmPassword');
  const toggle = document.getElementById('showSignUpPasswords');
  if (pw1 && pw2 && toggle) {
    const type = toggle.checked ? 'text' : 'password';
    pw1.type = type;
    pw2.type = type;
  }
}
window.toggleSignUpPasswords = toggleSignUpPasswords;

// --- SMART LOGIN SCRIPT ---
const SUPABASE_URL = 'https://aoejbzrvpcncfjwwuggo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZWpienJ2cGNuY2Zqd3d1Z2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjA4OTMsImV4cCI6MjA2ODMzNjg5M30.RpKOUROFdouWovfvbpwOWMJC2SW-LCcuSMmjoneIKT0';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let lastSignUpAttempt = 0;

function showSmartModal({title, message, type = 'info', autoClose = false, duration = 3000}) {
  const modal = document.getElementById('messageModal');
  const modalBody = document.getElementById('messageModalBody');
  const modalHeader = document.getElementById('messageModalHeader');
  const modalLabel = document.getElementById('messageModalLabel');
  if (!modal || !modalBody || !modalHeader || !modalLabel) return;
  // Always hide any open modal before showing a new one
  try {
    bootstrap.Modal.getOrCreateInstance(modal).hide();
  } catch (e) {}
  modalLabel.textContent = title || 'Message';
  modalBody.innerHTML = `<span class='fw-semibold ${type === 'success' ? 'text-success' : type === 'error' ? 'text-danger' : 'text-primary'}'>${message}</span>`;
  modalHeader.className = `modal-header bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'} text-white`;
  const instance = bootstrap.Modal.getOrCreateInstance(modal);
  instance.show();
  if (autoClose) {
    setTimeout(() => {
      instance.hide();
      resetModal();
    }, duration);
  }
}

function resetModal() {
  const modalBody = document.getElementById('messageModalBody');
  const modalHeader = document.getElementById('messageModalHeader');
  const modalLabel = document.getElementById('messageModalLabel');
  if (modalBody) modalBody.innerHTML = '';
  if (modalHeader) modalHeader.className = 'modal-header';
  if (modalLabel) modalLabel.textContent = 'Message';
}

function clearFormFields(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  Array.from(form.elements).forEach(el => {
    if (el.tagName === 'INPUT') {
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = false;
      } else {
        el.value = '';
      }
      el.setCustomValidity && el.setCustomValidity('');
      const next = el.nextElementSibling;
      if (next && next.classList && next.classList.contains('validation-error')) {
        next.textContent = '';
      }
    }
  });
  const meter = form.querySelector('#passwordStrengthMeter');
  if (meter) meter.innerHTML = '';
}

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

function togglePasswordVisibility(ids) {
  ids.forEach(id => {
    const field = document.getElementById(id);
    if (field) field.type = field.type === 'password' ? 'text' : 'password';
  });
}

function attachEventListeners() {
  document.getElementById('signInFormElement')?.addEventListener('submit', async e => {
    e.preventDefault();
    await signIn();
  });
  document.getElementById('signUpFormElement')?.addEventListener('submit', async e => {
    e.preventDefault();
    await signUp();
  });
  document.getElementById('showSignUpBtn')?.addEventListener('click', showSignUp);
  document.getElementById('showSignInBtn')?.addEventListener('click', showSignIn);
  document.getElementById('backToHomeBtn')?.addEventListener('click', () => window.location.href = '../index.html');
  document.getElementById('sendPasswordResetBtn')?.addEventListener('click', sendPasswordResetEmail);
  document.getElementById('showSignInPassword')?.addEventListener('click', () => togglePasswordVisibility(['signInPassword']));
  document.getElementById('showSignUpPasswords')?.addEventListener('click', () => togglePasswordVisibility(['signUpPassword', 'confirmPassword']));
  ['closeMessageModalBtn', 'closeMessageModalFooterBtn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      resetModal();
      bootstrap.Modal.getInstance(document.getElementById('messageModal'))?.hide();
    });
  });
  // For Google sign-in, use Supabase's OAuth provider and redirect to foodmenu.html after login
  document.getElementById('googleSignInBtn')?.addEventListener('click', async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/html/foodmenu.html`
        }
      });
      if (error) throw error;
      // The user will be redirected by Supabase after successful sign-in
    } catch (error) {
      showSmartModal({title: 'Google Sign-In', message: `Google sign-in failed: ${error.message}`, type: 'error'});
    }
  });
}

async function signIn() {
  const email = document.getElementById('signInIdentifier')?.value;
  const password = document.getElementById('signInPassword')?.value;
  if (!email || !password) {
    showSmartModal({title: 'Sign In', message: 'Please fill in all fields.', type: 'error'});
    return;
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      showSmartModal({title: 'Sign In', message: `Sign-in failed: ${error.message}`, type: 'error'});
      return;
    }
    showSmartModal({title: 'Sign In', message: 'Sign-in successful! Redirecting to menu...', type: 'success', autoClose: true});
    clearFormFields('signInFormElement');
    setTimeout(() => {
      window.location.href = 'foodmenu.html';
    }, 1200);
  } catch (error) {
    showSmartModal({title: 'Sign In', message: `Sign-in failed: ${error.message}`, type: 'error'});
  }
}

async function signUp() {
  const now = Date.now();
  const email = document.getElementById('signUpIdentifier')?.value;
  const password = document.getElementById('signUpPassword')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;
  if (now - lastSignUpAttempt < 5000) {
    // Just return silently, don't show modal
    return;
  }
  if (!email || !password || !confirmPassword) {
    showSmartModal({title: 'Sign Up', message: 'Please fill in all fields.', type: 'error'});
    return;
  }
  if (!isStrongPassword(password)) {
    showSmartModal({title: 'Sign Up', message: 'Password must be at least 8 characters long, include a number, an uppercase letter, and a lowercase letter.', type: 'error'});
    return;
  }
  if (password !== confirmPassword) {
    showSmartModal({title: 'Sign Up', message: 'Passwords do not match. Please try again.', type: 'error'});
    document.getElementById('confirmPassword').focus();
    return;
  }
  lastSignUpAttempt = now;
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      
      if (error.message && error.message.toLowerCase().includes('rate limit')) {
        showSmartModal({title: 'Sign Up', message: 'Please wait before trying to sign up again.', type: 'error'});
      } else {
        showSmartModal({title: 'Sign Up', message: `Sign-up failed: ${error.message}`, type: 'error'});
      }
      return;
    }
    showSmartModal({
      title: 'Sign Up',
      message: 'Sign-up successful! Please check your email for verification.',
      type: 'success',
      autoClose: false
    });
    clearFormFields('signUpFormElement');
    
  } catch (error) {
    showSmartModal({title: 'Sign Up', message: `Sign-up failed: ${error.message}`, type: 'error'});
  }
}

async function sendPasswordResetEmail() {
  const emailInput = document.getElementById('signInIdentifier');
  const email = emailInput?.value;
  if (!email) {
    showSmartModal({title: 'Password Reset', message: 'Please enter your email address to reset your password.', type: 'error'});
    return;
  }
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      showSmartModal({title: 'Password Reset', message: `Password reset failed: ${error.message}`, type: 'error'});
      return;
    }
    showSmartModal({title: 'Password Reset', message: 'Password reset email sent! Check your inbox.', type: 'success', autoClose: true});
    if (emailInput) emailInput.value = '';
  } catch (error) {
    showSmartModal({title: 'Password Reset', message: `Password reset failed: ${error.message}`, type: 'error'});
  }
}

function showSignUp() {
  toggleForms('signInForm', 'signUpForm');
}
function showSignIn() {
  toggleForms('signUpForm', 'signInForm');
}
function toggleForms(hideFormId, showFormId) {
  const hideForm = document.getElementById(hideFormId);
  const showForm = document.getElementById(showFormId);
  if (hideForm && showForm) {
    const newHideForm = hideForm.cloneNode(true);
    hideForm.parentNode.replaceChild(newHideForm, hideForm);
    newHideForm.style.transition = 'opacity 0.5s ease';
    showForm.style.transition = 'opacity 0.5s ease';
    newHideForm.style.opacity = 0;
    newHideForm.addEventListener('transitionend', function handler() {
      newHideForm.style.display = 'none';
      showForm.style.display = 'block';
      showForm.style.opacity = 0;
      void showForm.offsetWidth;
      showForm.style.opacity = 1;
      newHideForm.removeEventListener('transitionend', handler);
      attachEventListeners();
      clearFormFields('signInFormElement');
      clearFormFields('signUpFormElement');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Always show login/signup page, do not auto-redirect if user is signed in
  attachEventListeners();
  // Password strength and validation
  const signUpPassword = document.getElementById('signUpPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  const passwordStrengthMeter = document.getElementById('passwordStrengthMeter');
  function validateInput(inputElement, validationFn, errorMessage) {
    let errorElem = inputElement.nextElementSibling;
    if (!errorElem || !errorElem.classList.contains('validation-error')) {
      errorElem = document.createElement('div');
      errorElem.classList.add('validation-error');
      inputElement.parentNode.insertBefore(errorElem, inputElement.nextSibling);
    }
    if (!validationFn(inputElement.value)) {
      inputElement.setCustomValidity(errorMessage);
      errorElem.textContent = errorMessage;
    } else {
      inputElement.setCustomValidity('');
      errorElem.textContent = '';
    }
    inputElement.reportValidity();
  }
  function validateConfirmPassword() {
    validateInput(confirmPassword, val => val === signUpPassword.value, 'Passwords do not match.');
  }
  function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[\W_]/)) strength++;
    if (!passwordStrengthMeter) return;
    passwordStrengthMeter.innerHTML = '';
    passwordStrengthMeter.style.height = '8px';
    passwordStrengthMeter.style.borderRadius = '5px';
    passwordStrengthMeter.style.marginTop = '5px';
    let color = '', width = '';
    switch (strength) {
      case 0:
      case 1:
        color = 'red'; width = '20%'; break;
      case 2:
        color = 'orange'; width = '40%'; break;
      case 3:
        color = 'yellow'; width = '60%'; break;
      case 4:
        color = 'lightgreen'; width = '80%'; break;
      case 5:
        color = 'green'; width = '100%'; break;
    }
    passwordStrengthMeter.style.backgroundColor = '#ddd';
    const strengthBar = document.createElement('div');
    strengthBar.style.width = width;
    strengthBar.style.height = '100%';
    strengthBar.style.backgroundColor = color;
    strengthBar.style.borderRadius = '5px';
    strengthBar.style.transition = 'width 0.3s ease';
    passwordStrengthMeter.appendChild(strengthBar);
  }
  if (signUpPassword) {
    signUpPassword.addEventListener('input', (e) => {
      // Prevent auto-focusing to confirm password
      e.stopPropagation();
      validateInput(signUpPassword, val => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(val), 'Password must be at least 8 characters, include uppercase, lowercase, and a number.');
      checkPasswordStrength(signUpPassword.value);
      // Do not focus confirmPassword automatically
    });
  }
  if (confirmPassword) {
    confirmPassword.addEventListener('input', validateConfirmPassword);
  }
});
