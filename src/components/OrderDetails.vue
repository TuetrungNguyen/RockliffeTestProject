<script setup lang="ts">
import OrdersTable from './OrdersTable.vue';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

interface Props {
  employee?: Employee | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  logout: []
}>();

//Function to handle logout
const handleLogout = () => {
  emit('logout');
};
</script>

<template>
  <div class="admin-layout">
    <div class="main-content">
      <header class="top-header">
        <div class="header-left">
          <!-- Project logo -->
          <div class="header-logo">
            <span>Rockliffe Project</span>
          </div>
        </div>
        <div class="header-right">
          <!-- Logout button -->
          <button @click="handleLogout" class="logout-btn">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Logout
          </button>
          <!-- User profile avatar -->
          <div class="header-profile">
            <div class="profile-avatar">{{ employee?.firstName?.[0] || 'U' }}{{ employee?.lastName?.[0] || '' }}</div>
          </div>
        </div>
      </header>

      <main class="content-area">
        <!-- Welcome message -->
        <div class="welcome-section">
          <h1 class="welcome-title">Hi, Welcome {{ employee?.firstName || 'User' }}!</h1>
        </div>

        <!-- Orders table component -->
        <OrdersTable v-if="employee?.id" :employee-id="employee.id" />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Admin layout container */
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* Main content area */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Top header styling */
.top-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
}

/* Header left section */
.header-left {
  display: flex;
  align-items: center;
}

/* Header logo styling */
.header-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

/* Header right section */
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Logout button styling */
.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

/* Logout button hover state */
.logout-btn:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #1f2937;
}

/* Logout button icon size */
.logout-btn svg {
  width: 18px;
  height: 18px;
}

/* Header profile container */
.header-profile {
  display: flex;
  align-items: center;
}

/* Profile avatar styling */
.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #2563eb;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

/* Content area styling */
.content-area {
  flex: 1;
  padding: 24px;
  background-color: #f5f5f5;
}

/* Welcome section spacing */
.welcome-section {
  margin-bottom: 24px;
}

/* Welcome title styling */
.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

/* Welcome subtitle styling */
.welcome-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}
</style>
