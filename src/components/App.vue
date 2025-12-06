<script setup lang="ts">
import { ref } from 'vue';
import LoginDialog from './LoginDialog.vue';
import OrderDetails from './OrderDetails.vue';

// Variables to handle the login state and employee data
const isLoggedIn = ref(false);

const employeeData = ref<{ id: number; firstName: string; lastName: string } | null>(null);


const handleLoginSuccess = (employee: { id: number; firstName: string; lastName: string }) => {
  employeeData.value = employee;
  isLoggedIn.value = true;
};

const handleLogout = () => {
  isLoggedIn.value = false;
  employeeData.value = null;
};
</script>

<template>
  <!-- If the user is not logged in, show the login dialog -->
  <LoginDialog v-if="!isLoggedIn" @login-success="handleLoginSuccess" />
  <!-- If the user is logged in, show the order details -->
  <OrderDetails v-else :employee="employeeData" @logout="handleLogout" />
</template>
