<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{ 
  loginSuccess: [employee: { id: number; firstName: string; lastName: string }] 
}>();

//Employee credentials from the users
const employeeId = ref<number | string>('');
const password = ref('');

const errorMessage = ref('');
const successMessage = ref('');

const loading = ref(false);

//Function to handle the login
const handleLogin = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  loading.value = true;

  //Try to login the user
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ employeeId: employeeId.value, password: password.value })
    });

    //Get the response from the server
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      errorMessage.value = (json && (json.error || json.message)) || 'Invalid employee ID or password';
      return;
    }

    //If successful, show the success message
    successMessage.value = json?.message || 'Login successful!';
    setTimeout(() => {
      //Emit the login success event
      emit('loginSuccess', {
        id: json.id,
        firstName: json.firstName,
        lastName: json.lastName
      });
    }, 300);
  } catch (err) {
    //If there is an error, show the error message
    console.error('[LoginDialog] login error', err);
    errorMessage.value = 'Network or server error';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  
  <div class="login-card-wrapper">
    <div class="fallback-card">
      <!-- Login title -->
      <h2 class="text-xl font-semibold">Login</h2>
      <div class="card-content">
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <!-- Employee ID input -->
            <label for="employeeId" class="form-label">Employee ID</label>
            <input id="employeeId" v-model.number="employeeId" type="number" placeholder="Please type your employee ID" class="form-input" required min="1" />
          </div>
          <div class="form-group">
            <!-- Password input -->
            <label for="password" class="form-label">Password</label>
            <input id="password" v-model="password" type="password" placeholder="Please type your password" class="form-input" required />
          </div>
          <!-- Display the error or success message -->
          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
          <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

          <button :disabled="loading" type="submit" class="login-button">
            <span v-if="loading">Logging in…</span><span v-else>Login</span>
            
          </button>
        </form>
      </div>
    </div>
  </div>
</template>



<style scoped>
/* Style for the login card wrapper */
.login-card-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-image: url('/rckbg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

/* Dark overlay to improve text readability over background image */
.login-card-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/*login card styling */
.fallback-card {
  width: 100%;
  max-width: 480px;
  padding: 48px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

/* Login title styling */
.fallback-card h2 {
  margin: 0 0 40px 0;
  color: #ffffff;
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
}

/* Card content text color */
.card-content {
  color: #ffffff;
}

/* Login form layout */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* Form group container for label and input */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Form label styling */
.form-label {
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Form input field base styling */
.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  font-size: 1rem;
  transition: all 0.2s;
  box-sizing: border-box;
}

/* Form input hover state */
.form-input:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

/* Form input focus state */
.form-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.2);
}

/* Form input placeholder text color */
.form-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

/* Remove number input spinner buttons for webkit browsers */
.form-input[type='number']::-webkit-outer-spin-button,
.form-input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Remove number input spinner buttons for Firefox */
.form-input[type='number'] {
  -moz-appearance: textfield;
}

/* Error message styling */
.error-message {
  padding: 12px;
  background: rgba(239, 68, 68, 0.2);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.875rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Success message styling */
.success-message {
  padding: 12px;
  background: rgba(34, 197, 94, 0.2);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(34, 197, 94, 0.4);
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.875rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Login button base styling */
.login-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
}

/* Login button hover state */
.login-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

/* Login button active/pressed state */
.login-button:active:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  transform: translateY(0);
}

/* Login button disabled state */
.login-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
