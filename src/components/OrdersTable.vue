<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

//Interfaces defining data structures
interface Order {
  OrderID: number;
  OrderDate: string;
  RequiredDate: string | null;
  ShippedDate: string | null;
  Freight: number | null;
  ShipName: string | null;
  ShipCity: string | null;
  ShipCountry: string | null;
  CustomerName: string | null;
  CustomerContact: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface Props {
  employeeId: number;
}

const props = defineProps<Props>();

//Orders list and loading state
const orders = ref<Order[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const pagination = ref<Pagination>({
  page: 1,
  limit: 50,
  totalCount: 0,
  totalPages: 0
});

//Available countries for filter
const availableCountries = ref<string[]>([]);

//Modal state for order details
const showModal = ref(false);
const selectedOrderId = ref<number | null>(null);
const orderDetails = ref<any>(null);
const orderDetailsLoading = ref(false);
const orderDetailsError = ref<string | null>(null);

//Tab and filter state
const activeTab = ref('all');
const showAdvancedFilters = ref(false);

const tabs = [
  { label: 'All Orders', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Unfulfilled', value: 'unfulfilled' },
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Paid Orders', value: 'paid' }
];

//Function to select a tab and apply filter
const selectTab = (tabValue: string) => {
  activeTab.value = tabValue;
  if (tabValue === 'all') {
    filters.value.status = 'all';
  } else if (tabValue === 'unfulfilled') {
    filters.value.status = 'pending';
  } else if (tabValue === 'paid') {
    filters.value.status = 'shipped';
  } else if (tabValue === 'unpaid') {
    filters.value.status = 'overdue';
  } else {
    filters.value.status = 'all';
  }
  applyFilters();
};

//Filter values
const filters = ref({
  status: 'all',
  customerName: '',
  country: '',
  dateFrom: '',
  dateTo: ''
});

//Timer for debouncing search input to avoid excessive API calls
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const current = pagination.value.page;
  const total = pagination.value.totalPages;
  const maxVisible = 7;

  if (total <= maxVisible) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (current > 3) {
      pages.push('...');
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push('...');
    }

    pages.push(total);
  }

  return pages;
});

//Build query string from filters and pagination
const buildQueryString = () => {
  const params = new URLSearchParams();
  params.set('employeeId', props.employeeId.toString());
  params.set('page', pagination.value.page.toString());
  params.set('limit', pagination.value.limit.toString());
  
  if (filters.value.status !== 'all') {
    params.set('status', filters.value.status);
  }
  if (filters.value.customerName) {
    params.set('customerName', filters.value.customerName);
  }
  if (filters.value.country) {
    params.set('country', filters.value.country);
  }
  if (filters.value.dateFrom) {
    params.set('dateFrom', filters.value.dateFrom);
  }
  if (filters.value.dateTo) {
    params.set('dateTo', filters.value.dateTo);
  }
  
  return params.toString();
};

//Fetch orders from the API
const fetchOrders = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const queryString = buildQueryString();
    const response = await fetch(`/api/orders?${queryString}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch orders');
    }
    
    const data = await response.json();
    orders.value = data.orders || [];
    pagination.value = data.pagination || pagination.value;
    
    if (data.filters?.countries) {
      availableCountries.value = data.filters.countries;
    }
  } catch (err) {
    console.error('[OrdersTable] Error fetching orders:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load orders';
  } finally {
    loading.value = false;
  }
};

//Apply filters and reset to page 1
const applyFilters = () => {
  pagination.value.page = 1;
  fetchOrders();
};

//Debounced filter application for search input
const debouncedApplyFilters = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    applyFilters();
  }, 500);
};

//Clear all filters
const clearFilters = () => {
  filters.value = {
    status: 'all',
    customerName: '',
    country: '',
    dateFrom: '',
    dateTo: ''
  };
  applyFilters();
};

//Handle page number click
const handlePageClick = (pageNum: number | string) => {
  if (typeof pageNum === 'number') {
    goToPage(pageNum);
  }
};

//Navigate to specific page
const goToPage = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page;
    fetchOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

//Format date string to readable format
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return dateString;
  }
};

//Format currency amount
const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return '0.00';
  return amount.toFixed(2);
};

//Format address components into single string
const formatAddress = (address: string | null, city: string | null, region: string | null, postalCode: string | null, country: string | null) => {
  const parts = [address, city, region, postalCode, country].filter(part => part);
  return parts.length > 0 ? parts.join(', ') : 'N/A';
};

//Open order details modal
const openOrderDetails = async (orderId: number) => {
  selectedOrderId.value = orderId;
  showModal.value = true;
  orderDetails.value = null;
  orderDetailsError.value = null;
  orderDetailsLoading.value = true;

  try {
    const response = await fetch(`/api/order-details?orderId=${orderId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch order details');
    }
    
    const data = await response.json();
    orderDetails.value = data;
  } catch (err) {
    console.error('[OrdersTable] Error fetching order details:', err);
    orderDetailsError.value = err instanceof Error ? err.message : 'Failed to load order details';
  } finally {
    orderDetailsLoading.value = false;
  }
};

//Close order details modal
const closeModal = () => {
  showModal.value = false;
  selectedOrderId.value = null;
  orderDetails.value = null;
  orderDetailsError.value = null;
};

//Get payment status text
const getPaymentStatus = (shippedDate: string | null, requiredDate: string | null) => {
  if (shippedDate) return 'Paid';
  return 'Authorized';
};

//Get payment status CSS class
const getPaymentStatusClass = (shippedDate: string | null, requiredDate: string | null) => {
  if (shippedDate) return 'status-paid';
  return 'status-authorized';
};

//Get fulfillment status text
const getFulfillmentStatus = (shippedDate: string | null, requiredDate: string | null) => {
  if (shippedDate) return 'Fulfilled';
  if (requiredDate) {
    const required = new Date(requiredDate);
    const now = new Date();
    if (now > required) return 'Overdue';
    return 'Unfulfilled';
  }
  return 'Unfulfilled';
};

//Get fulfillment status CSS class
const getFulfillmentStatusClass = (shippedDate: string | null, requiredDate: string | null) => {
  if (shippedDate) return 'status-fulfilled';
  if (requiredDate) {
    const required = new Date(requiredDate);
    const now = new Date();
    if (now > required) return 'status-overdue';
    return 'status-unfulfilled';
  }
  return 'status-unfulfilled';
};

//Fetch orders when component mounts
onMounted(() => {
  if (props.employeeId) {
    fetchOrders();
  }
});
</script>

<template>
  <div class="orders-table-container">
    <!-- Filter tabs -->
    <div class="tabs-section">
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.value"
          @click="selectTab(tab.value)"
          :class="['tab', { active: activeTab === tab.value }]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Search and filter button -->
    <div class="search-actions-bar">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
          <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <input 
          type="text" 
          v-model="filters.customerName" 
          @input="debouncedApplyFilters"
          placeholder="Search here"
          class="search-input"
        />
      </div>
      <div class="action-buttons">
        <button class="action-btn" @click="showAdvancedFilters = !showAdvancedFilters">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H21M7 12H17M10 18H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Filters
        </button>
      </div>
    </div>

    <!-- Advanced filters panel -->
    <div v-if="showAdvancedFilters" class="advanced-filters">
      <div class="filters-grid">
        <div class="filter-group">
          <label for="country-filter">Country</label>
          <select id="country-filter" v-model="filters.country" @change="applyFilters" class="filter-input">
            <option value="">All Countries</option>
            <option v-for="country in availableCountries" :key="country" :value="country">
              {{ country }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="date-from-filter">Date From</label>
          <input 
            id="date-from-filter" 
            type="date" 
            v-model="filters.dateFrom" 
            @change="applyFilters"
            class="filter-input"
          />
        </div>
        
        <div class="filter-group">
          <label for="date-to-filter">Date To</label>
          <input 
            id="date-to-filter" 
            type="date" 
            v-model="filters.dateTo" 
            @change="applyFilters"
            class="filter-input"
          />
        </div>
        
        <div class="filter-group filter-actions">
          <button @click="clearFilters" class="clear-filters-btn">Clear Filters</button>
        </div>
      </div>
    </div>

    <!-- Loading, error, or empty state messages -->
    <div v-if="loading" class="loading-message">Loading orders...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="orders.length === 0" class="no-orders-message">
      No orders found matching your filters.
    </div>
    
    <!-- Orders table -->
    <div v-else class="orders-table-wrapper">
      <table class="orders-table">
        <thead>
          <tr>
            <th>ORDER</th>
            <th>DATE</th>
            <th>CUSTOMER</th>
            <th>PAYMENT STATUS</th>
            <th>FULFILLMENT STATUS</th>
            <th>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="order in orders" 
            :key="order.OrderID" 
            class="order-row"
            @click="openOrderDetails(order.OrderID)"
          >
            <td class="order-id">#{{ order.OrderID }}</td>
            <td>{{ formatDate(order.OrderDate) }}</td>
            <td>{{ order.CustomerName || 'N/A' }}</td>
            <td>
              <span class="status-badge payment-status" :class="getPaymentStatusClass(order.ShippedDate, order.RequiredDate)">
                {{ getPaymentStatus(order.ShippedDate, order.RequiredDate) }}
              </span>
            </td>
            <td>
              <span class="status-badge fulfillment-status" :class="getFulfillmentStatusClass(order.ShippedDate, order.RequiredDate)">
                {{ getFulfillmentStatus(order.ShippedDate, order.RequiredDate) }}
              </span>
            </td>
            <td class="order-total">${{ formatCurrency(order.Freight) }}</td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination controls -->
      <div class="pagination-section">
        <div class="pagination-info">
          Showing {{ ((pagination.page - 1) * pagination.limit) + 1 }} to 
          {{ Math.min(pagination.page * pagination.limit, pagination.totalCount) }} of 
          {{ pagination.totalCount }} orders
        </div>
        <div class="pagination-controls">
          <button 
            @click="goToPage(pagination.page - 1)" 
            :disabled="pagination.page === 1"
            class="pagination-btn"
          >
            Previous
          </button>
          
          <div class="page-numbers">
            <button
              v-for="pageNum in visiblePages"
              :key="pageNum"
              @click="handlePageClick(pageNum)"
              :disabled="pageNum === '...'"
              :class="['page-number', { active: pageNum === pagination.page }]"
            >
              {{ pageNum }}
            </button>
          </div>
          
          <button 
            @click="goToPage(pagination.page + 1)" 
            :disabled="pagination.page === pagination.totalPages"
            class="pagination-btn"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Order details modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Order Details #{{ selectedOrderId }}</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <!-- Modal loading, error, or content -->
        <div v-if="orderDetailsLoading" class="modal-body loading">
          Loading order details...
        </div>
        
        <div v-else-if="orderDetailsError" class="modal-body error">
          {{ orderDetailsError }}
        </div>
        
        <div v-else-if="orderDetails" class="modal-body">
          <!-- Order information section -->
          <div class="details-section">
            <h3>Order Information</h3>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Order Date:</span>
                <span class="detail-value">{{ formatDate(orderDetails.order.OrderDate) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Required Date:</span>
                <span class="detail-value">{{ formatDate(orderDetails.order.RequiredDate) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Shipped Date:</span>
                <span class="detail-value">{{ formatDate(orderDetails.order.ShippedDate) || 'Not shipped' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Employee:</span>
                <span class="detail-value">{{ orderDetails.order.EmployeeName || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Shipper:</span>
                <span class="detail-value">{{ orderDetails.order.ShipperName || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- Customer information section -->
          <div class="details-section">
            <h3>Customer Information</h3>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Company:</span>
                <span class="detail-value">{{ orderDetails.order.CustomerName || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Contact:</span>
                <span class="detail-value">{{ orderDetails.order.CustomerContact || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">{{ orderDetails.order.CustomerPhone || 'N/A' }}</span>
              </div>
              <div class="detail-item full-width">
                <span class="detail-label">Address:</span>
                <span class="detail-value">
                  {{ formatAddress(orderDetails.order.CustomerAddress, orderDetails.order.CustomerCity, orderDetails.order.CustomerRegion, orderDetails.order.CustomerPostalCode, orderDetails.order.CustomerCountry) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Shipping information section -->
          <div class="details-section">
            <h3>Shipping Information</h3>
            <div class="details-grid">
              <div class="detail-item full-width">
                <span class="detail-label">Ship To:</span>
                <span class="detail-value">{{ orderDetails.order.ShipName || 'N/A' }}</span>
              </div>
              <div class="detail-item full-width">
                <span class="detail-label">Address:</span>
                <span class="detail-value">
                  {{ formatAddress(orderDetails.order.ShipAddress, orderDetails.order.ShipCity, orderDetails.order.ShipRegion, orderDetails.order.ShipPostalCode, orderDetails.order.ShipCountry) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Order items table -->
          <div class="details-section">
            <h3>Order Items</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Discount</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in orderDetails.items" :key="item.ProductID">
                  <td>
                    <div class="product-name">{{ item.ProductName || `Product #${item.ProductID}` }}</div>
                    <div class="product-unit">{{ item.QuantityPerUnit || '' }}</div>
                  </td>
                  <td>${{ formatCurrency(item.UnitPrice) }}</td>
                  <td>{{ item.Quantity }}</td>
                  <td>{{ (item.Discount * 100).toFixed(0) }}%</td>
                  <td class="item-total">${{ formatCurrency(item.UnitPrice * item.Quantity * (1 - item.Discount)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Order totals section -->
          <div class="details-section totals-section">
            <div class="totals-grid">
              <div class="total-item">
                <span class="total-label">Subtotal:</span>
                <span class="total-value">${{ orderDetails.totals.subtotal }}</span>
              </div>
              <div class="total-item">
                <span class="total-label">Freight:</span>
                <span class="total-value">${{ formatCurrency(orderDetails.totals.freight) }}</span>
              </div>
              <div class="total-item grand-total">
                <span class="total-label">Total:</span>
                <span class="total-value">${{ orderDetails.totals.total }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Orders table container */
.orders-table-container {
  width: 100%;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Tabs section styling */
.tabs-section {
  border-bottom: 1px solid #e5e7eb;
  background-color: #ffffff;
  border-radius: 8px 8px 0 0;
}

/* Tabs container */
.tabs {
  display: flex;
  gap: 0;
  padding: 0 16px;
  overflow-x: auto;
}

/* Tab button styling */
.tab {
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

/* Tab hover state */
.tab:hover {
  color: #2563eb;
}

/* Active tab styling */
.tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

/* Search and actions bar */
.search-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  gap: 16px;
}

/* Search box container */
.search-box {
  flex: 1;
  max-width: 400px;
  position: relative;
  display: flex;
  align-items: center;
}

/* Search icon styling */
.search-icon {
  position: absolute;
  left: 12px;
  width: 18px;
  height: 18px;
  color: #9ca3af;
  pointer-events: none;
}

/* Search input field */
.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1f2937;
  background-color: #ffffff;
  transition: all 0.2s;
}

/* Search input focus state */
.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Action buttons container */
.action-buttons {
  display: flex;
  gap: 8px;
}

/* Action button styling */
.action-btn {
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

/* Action button hover state */
.action-btn:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #1f2937;
}

/* Action button icon size */
.action-btn svg {
  width: 16px;
  height: 16px;
}

/* Advanced filters panel */
.advanced-filters {
  padding: 16px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

/* Filters grid layout */
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  align-items: end;
}

/* Filter group container */
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Filter label styling */
.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

/* Filter input field */
.filter-input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #ffffff;
  color: #1f2937;
  font-size: 0.875rem;
  transition: all 0.2s;
}

/* Filter input hover and focus states */
.filter-input:hover,
.filter-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Filter actions alignment */
.filter-actions {
  justify-content: flex-end;
}

/* Clear filters button */
.clear-filters-btn {
  padding: 8px 16px;
  background-color: #ffffff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

/* Clear filters button hover state */
.clear-filters-btn:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #1f2937;
}

/* Loading, error, and empty state messages */
.loading-message,
.error-message,
.no-orders-message {
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
  font-size: 0.875rem;
  background-color: #ffffff;
}

/* Error message styling */
.error-message {
  color: #ef4444;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
}

/* No orders message styling */
.no-orders-message {
  color: #6b7280;
}

/* Orders table wrapper */
.orders-table-wrapper {
  background-color: #ffffff;
  overflow: hidden;
  border-radius: 0 0 8px 8px;
}

/* Orders table styling */
.orders-table {
  width: 100%;
  border-collapse: collapse;
  color: #1f2937;
}

/* Orders table header */
.orders-table thead {
  background-color: #f9fafb;
}

/* Orders table header cells */
.orders-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
}

/* Orders table row styling */
.orders-table tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
  cursor: pointer;
}

/* Orders table row hover state */
.orders-table tbody tr:hover {
  background-color: #f9fafb;
}

/* Orders table last row */
.orders-table tbody tr:last-child {
  border-bottom: none;
}

/* Orders table cells */
.orders-table td {
  padding: 12px 16px;
  font-size: 0.875rem;
  color: #1f2937;
}

/* Order ID styling */
.order-id {
  font-weight: 600;
  color: #2563eb;
}

/* Order total styling */
.order-total {
  font-weight: 600;
  color: #1f2937;
}

/* Status badge base styling */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Paid status badge */
.status-paid {
  background-color: #d1fae5;
  color: #065f46;
}

/* Authorized status badge */
.status-authorized {
  background-color: #fef3c7;
  color: #92400e;
}

/* Fulfilled status badge */
.status-fulfilled {
  background-color: #d1fae5;
  color: #065f46;
}

/* Unfulfilled status badge */
.status-unfulfilled {
  background-color: #fee2e2;
  color: #991b1b;
}

/* Overdue status badge */
.status-overdue {
  background-color: #fee2e2;
  color: #991b1b;
}

/* Pagination section */
.pagination-section {
  padding: 16px;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.pagination-info {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Pagination controls container */
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  padding: 8px 12px;
  background-color: #ffffff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Pagination button hover state */
.pagination-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #1f2937;
}

/* Pagination button disabled state */
.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Page numbers container */
.page-numbers {
  display: flex;
  gap: 4px;
}

/* Page number button */
.page-number {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  background-color: #ffffff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Page number hover state */
.page-number:hover:not(.active):not(:disabled) {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #1f2937;
}

/* Active page number */
.page-number.active {
  background-color: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
  font-weight: 600;
}

/* Page number disabled state */
.page-number:disabled {
  cursor: default;
  opacity: 0.5;
}

/* Modal overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

/* Modal content container */
.modal-content {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

/* Modal header */
.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
}

/* Modal header title */
.modal-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
}

/* Close button */
.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

/* Close button hover state */
.close-btn:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

/* Modal body */
.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* Modal body loading and error states */
.modal-body.loading,
.modal-body.error {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

/* Modal body error state */
.modal-body.error {
  color: #ef4444;
}

/* Details section container */
.details-section {
  margin-bottom: 24px;
}

/* Details section heading */
.details-section h3 {
  color: #2563eb;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

/* Details grid layout */
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

/* Detail item container */
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Full width detail item */
.detail-item.full-width {
  grid-column: 1 / -1;
}

/* Detail label styling */
.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

/* Detail value styling */
.detail-value {
  font-size: 0.875rem;
  color: #1f2937;
}

/* Order items table */
.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

/* Items table header */
.items-table thead {
  background-color: #f9fafb;
}

/* Items table header cells */
.items-table th {
  padding: 12px;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
}

/* Items table cells */
.items-table td {
  padding: 12px;
  font-size: 0.875rem;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
}

/* Items table row hover state */
.items-table tbody tr:hover {
  background-color: #f9fafb;
}

/* Product name styling */
.product-name {
  font-weight: 500;
  color: #1f2937;
}

/* Product unit styling */
.product-unit {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 4px;
}

/* Item total styling */
.item-total {
  font-weight: 600;
  color: #2563eb;
}

/* Totals section */
.totals-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid #e5e7eb;
}

/* Totals grid layout */
.totals-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

/* Total item container */
.total-item {
  display: flex;
  justify-content: space-between;
  min-width: 200px;
  max-width: 250px;
  padding: 8px 0;
}

/* Grand total item */
.total-item.grand-total {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
  margin-top: 8px;
}

/* Total label styling */
.total-label {
  font-size: 1rem;
  color: #6b7280;
  font-weight: 500;
}

/* Grand total label */
.total-item.grand-total .total-label {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

/* Total value styling */
.total-value {
  font-size: 1rem;
  color: #2563eb;
  font-weight: 600;
}

/* Grand total value */
.total-item.grand-total .total-value {
  font-size: 1.25rem;
  color: #2563eb;
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  .orders-table-wrapper {
    overflow-x: auto;
  }
  
  .orders-table {
    min-width: 800px;
  }

  .search-actions-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: 100%;
  }

  .modal-content {
    max-width: 100%;
    margin: 0;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .total-item {
    width: 100%;
  }

  .items-table {
    font-size: 0.75rem;
  }

  .items-table th,
  .items-table td {
    padding: 8px;
  }
}
</style>
