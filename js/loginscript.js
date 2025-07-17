
// --- SMART LOGIN SCRIPT ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail as firebaseSendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3WepVTRUMKtjBpdUGrB8XfMve-ZUCjWs",
  authDomain: "bon-jour-base.firebaseapp.com",
  databaseURL: "https://bon-jour-base-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bon-jour-base",
  storageBucket: "bon-jour-base.appspot.com",
  messagingSenderId: "357223269073",
  appId: "1:357223269073:web:e18c2ab7f5cb91fc917bf0",
  measurementId: "G-CJNHMJF8TJ"
};

let lastSignUpAttempt = 0;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function showSmartModal({title, message, type = 'info', autoClose = false, duration = 3000}) {
  const modal = document.getElementById('messageModal');
  const modalBody = document.getElementById('messageModalBody');
  const modalHeader = document.getElementById('messageModalHeader');
  const modalLabel = document.getElementById('messageModalLabel');
  if (!modal || !modalBody || !modalHeader || !modalLabel) return;
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
  document.getElementById('googleSignInBtn')?.addEventListener('click', async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showSmartModal({title: 'Google Sign-In', message: 'Google sign-in successful!', type: 'success', autoClose: true});
      // window.location.href = "foodmenu.html";
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (userCredential.user && !userCredential.user.emailVerified) {
      showSmartModal({title: 'Sign In', message: 'Please verify your email before signing in.', type: 'error'});
      return;
    }
    showSmartModal({title: 'Sign In', message: 'Sign-in successful!', type: 'success', autoClose: true});
    clearFormFields('signInFormElement');
    // window.location.href = "foodmenu.html";
  } catch (error) {
    showSmartModal({title: 'Sign In', message: `Sign-in failed: ${error.message}`, type: 'error'});
  }
}

async function signUp() {
  const now = Date.now();
  if (now - lastSignUpAttempt < 5000) {
    showSmartModal({title: 'Sign Up', message: 'Please wait before trying to sign up again.', type: 'error'});
    return;
  }
  lastSignUpAttempt = now;
  const email = document.getElementById('signUpIdentifier')?.value;
  const password = document.getElementById('signUpPassword')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;
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
    return;
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      try {
        await userCredential.user.sendEmailVerification();
        showSmartModal({title: 'Sign Up', message: 'Sign-up successful! Please verify your email before signing in.', type: 'success', autoClose: true});
      } catch (verifyErr) {
        showSmartModal({title: 'Sign Up', message: 'Sign-up successful, but failed to send verification email. Please try again later.', type: 'error'});
      }
    } else {
      showSmartModal({title: 'Sign Up', message: 'Sign-up successful, but could not send verification email.', type: 'error'});
    }
    clearFormFields('signUpFormElement');
    showSignIn();
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
    await firebaseSendPasswordResetEmail(auth, email);
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
  signUpPassword?.addEventListener('input', () => {
    validateInput(signUpPassword, val => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(val), 'Password must be at least 8 characters, include uppercase, lowercase, and a number.');
    checkPasswordStrength(signUpPassword.value);
    validateConfirmPassword();
  });
  confirmPassword?.addEventListener('input', validateConfirmPassword);
});
