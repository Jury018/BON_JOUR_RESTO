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
// Supabase integration removed

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

async function signIn() {
  const email = document.getElementById('signInIdentifier')?.value;
  const password = document.getElementById('signInPassword')?.value;
  
  if (!email || !password) {
    showSmartModal({title: 'Sign In', message: 'Please fill in all fields.', type: 'error'});
    return;
  }

  try {
    const result = await firebase.auth().signInWithEmailAndPassword(email, password);
    showSmartModal({title: 'Sign In', message: 'Sign-in successful! Redirecting...', type: 'success', autoClose: true});
    
    // Save user info for frontend use
    localStorage.setItem('resto_user', JSON.stringify({ 
      email: result.user.email,
      uid: result.user.uid
    }));

    // Set session cookie for middleware
    document.cookie = "resto_session=true; path=/; max-age=2592000; SameSite=Lax";

    clearFormFields('signInFormElement');
    setTimeout(() => {
      window.location.href = '/html/foodmenu';
    }, 1200);
  } catch (error) {
    let message = error.message;
    if (error.code === 'auth/user-not-found') {
      message = "We couldn't find an account with this email. Would you like to create one?";
      showSmartModal({
        title: 'Account Not Found', 
        message: message, 
        type: 'info'
      });
      // Optionally switch to sign up after a delay
      setTimeout(showSignUp, 3000);
    } else if (error.code === 'auth/wrong-password') {
      message = "Incorrect password. Please try again or reset your password.";
      showSmartModal({title: 'Sign In Error', message: message, type: 'error'});
    } else {
      showSmartModal({title: 'Sign In Error', message: message, type: 'error'});
    }
  }
}

async function signUp() {
  const now = Date.now();
  const email = document.getElementById('signUpIdentifier')?.value;
  const password = document.getElementById('signUpPassword')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;

  if (now - lastSignUpAttempt < 5000) return;

  if (!email || !password || !confirmPassword) {
    showSmartModal({title: 'Sign Up', message: 'Please fill in all fields.', type: 'error'});
    return;
  }

  if (!isStrongPassword(password)) {
    showSmartModal({title: 'Sign Up', message: 'Password must be at least 8 characters long, include a number, an uppercase letter, and a lowercase letter.', type: 'error'});
    return;
  }

  if (password !== confirmPassword) {
    showSmartModal({title: 'Sign Up', message: 'Passwords do not match.', type: 'error'});
    return;
  }

  try {
    lastSignUpAttempt = now;
    await firebase.auth().createUserWithEmailAndPassword(email, password);
    showSmartModal({title: 'Sign Up', message: 'Account created successfully! You can now sign in.', type: 'success'});
    clearFormFields('signUpFormElement');
    showSignIn(); // Switch to sign in form
  } catch (error) {
    let message = error.message;
    if (error.code === 'auth/email-already-in-use') {
      message = "This email is already registered. Try signing in instead.";
      showSmartModal({title: 'Account Exists', message: message, type: 'info'});
      setTimeout(showSignIn, 3000);
    } else {
      showSmartModal({title: 'Sign Up Error', message: message, type: 'error'});
    }
  }
}

async function signOut() {
  try {
    if (typeof firebase !== 'undefined' && firebase.auth()) {
      await firebase.auth().signOut();
    }
    // Clear localStorage
    localStorage.removeItem('resto_user');
    // Clear session cookie
    document.cookie = "resto_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    showSmartModal({title: 'Sign Out', message: 'You have been signed out.', type: 'info', autoClose: true});
    setTimeout(() => {
      window.location.href = '/';
    }, 1200);
  } catch (error) {
    showSmartModal({title: 'Sign Out Error', message: error.message, type: 'error'});
  }
}
window.signOut = signOut;

async function sendPasswordResetEmail() {
  const email = document.getElementById('signInIdentifier')?.value;
  if (!email) {
    showSmartModal({title: 'Password Reset', message: 'Please enter your email address first.', type: 'error'});
    return;
  }

  try {
    await firebase.auth().sendPasswordResetEmail(email);
    showSmartModal({title: 'Password Reset', message: 'Password reset email sent! Check your inbox.', type: 'success'});
  } catch (error) {
    showSmartModal({title: 'Reset Error', message: error.message, type: 'error'});
  }
}

async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await firebase.auth().signInWithPopup(provider);
    showSmartModal({title: 'Google Sign In', message: `Welcome ${result.user.displayName}! Redirecting...`, type: 'success', autoClose: true});
    
    localStorage.setItem('resto_user', JSON.stringify({ 
      email: result.user.email,
      uid: result.user.uid,
      displayName: result.user.displayName
    }));

    // Set session cookie for middleware
    document.cookie = "resto_session=true; path=/; max-age=2592000; SameSite=Lax";

    setTimeout(() => {
      window.location.href = '/html/foodmenu';
    }, 1200);
  } catch (error) {
    showSmartModal({title: 'Google Sign In Error', message: error.message, type: 'error'});
  }
}

async function signInWithGuest() {
  try {
    const result = await firebase.auth().signInAnonymously();
    showSmartModal({title: 'Guest Access', message: 'Signed in as a guest! Redirecting...', type: 'info', autoClose: true});
    
    localStorage.setItem('resto_user', JSON.stringify({ 
      isGuest: true,
      uid: result.user.uid
    }));

    // Set session cookie for middleware
    document.cookie = "resto_session=true; path=/; max-age=2592000; SameSite=Lax";

    setTimeout(() => {
      window.location.href = '/html/foodmenu';
    }, 1200);
  } catch (error) {
    showSmartModal({title: 'Guest Sign In Error', message: error.message, type: 'error'});
  }
}

// Update event listener for Google sign-in
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
  document.getElementById('backToHomeBtn')?.addEventListener('click', () => window.location.href = '/');
  document.getElementById('sendPasswordResetBtn')?.addEventListener('click', sendPasswordResetEmail);
  document.getElementById('showSignInPassword')?.addEventListener('click', () => togglePasswordVisibility(['signInPassword']));
  document.getElementById('showSignUpPasswords')?.addEventListener('click', () => togglePasswordVisibility(['signUpPassword', 'confirmPassword']));
  ['closeMessageModalBtn', 'closeMessageModalFooterBtn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      resetModal();
      bootstrap.Modal.getInstance(document.getElementById('messageModal'))?.hide();
    });
  });
  
  // Re-enable Social sign-ins
  document.getElementById('googleSignInBtn')?.addEventListener('click', signInWithGoogle);
  document.getElementById('guestSignInBtn')?.addEventListener('click', signInWithGuest);
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
    hideForm.classList.add('auth-switch-fade');
    hideForm.style.display = 'none';
    
    showForm.style.display = 'block';
    showForm.classList.add('auth-switch-fade');
    
    clearFormFields('signInFormElement');
    clearFormFields('signUpFormElement');
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
