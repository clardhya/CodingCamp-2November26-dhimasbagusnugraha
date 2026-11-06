// Spendly Personal Expense Tracker - Main JavaScript File
// Optional Challenges: Monthly Summary & Dark/Light Mode

console.log('Spendly Expense Tracker loaded');

// === CORE DATA LAYER ===

// Transaction array - single source of truth for runtime state
let transactions = [];

// Default categories
const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];

// Custom categories array
let customCategories = [];

// Current month for monthly summary (0 = January, 11 = December)
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Theme management
const THEME_STORAGE_KEY = 'spendly-theme';
const DEFAULT_THEME = 'light';

// Local Storage keys
const STORAGE_KEY = 'spendly-transactions';
const CATEGORIES_STORAGE_KEY = 'spendly-categories';

/**
 * Load transactions from Local Storage
 * Handles missing or invalid data by returning empty array
 */
function loadTransactions() {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (!storedData) {
            console.log('No stored transactions found, initializing empty array');
            return [];
        }
        
        const parsedData = JSON.parse(storedData);
        
        // Validate that parsed data is an array
        if (!Array.isArray(parsedData)) {
            console.warn('Stored data is not an array, initializing empty array');
            return [];
        }
        
        // Validate each transaction has required fields
        const validTransactions = parsedData.filter(tx => 
            tx && 
            typeof tx.id === 'string' &&
            typeof tx.name === 'string' && 
            typeof tx.amount === 'number' &&
            typeof tx.category === 'string' &&
            typeof tx.date === 'string'
        );
        
        console.log(`Loaded ${validTransactions.length} valid transactions from Local Storage`);
        return validTransactions;
        
    } catch (error) {
        console.error('Error loading transactions from Local Storage:', error);
        return [];
    }
}

/**
 * Load custom categories from Local Storage
 */
function loadCustomCategories() {
    try {
        const storedData = localStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (!storedData) {
            console.log('No custom categories found, initializing empty array');
            return [];
        }
        
        const parsedData = JSON.parse(storedData);
        
        // Validate that parsed data is an array
        if (!Array.isArray(parsedData)) {
            console.warn('Stored categories data is not an array, initializing empty array');
            return [];
        }
        
        // Validate each category is a non-empty string
        const validCategories = parsedData.filter(cat => 
            cat && typeof cat === 'string' && cat.trim() !== ''
        );
        
        console.log(`Loaded ${validCategories.length} custom categories from Local Storage`);
        return validCategories;
        
    } catch (error) {
        console.error('Error loading custom categories from Local Storage:', error);
        return [];
    }
}

/**
 * Load theme preference from Local Storage
 */
function loadThemePreference() {
    try {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        return storedTheme || DEFAULT_THEME;
    } catch (error) {
        console.error('Error loading theme preference:', error);
        return DEFAULT_THEME;
    }
}

/**
 * Save current transactions array to Local Storage
 */
function saveTransactions() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        console.log(`Saved ${transactions.length} transactions to Local Storage`);
    } catch (error) {
        console.error('Error saving transactions to Local Storage:', error);
    }
}

/**
 * Save custom categories to Local Storage
 */
function saveCustomCategories() {
    try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(customCategories));
        console.log(`Saved ${customCategories.length} custom categories to Local Storage`);
    } catch (error) {
        console.error('Error saving custom categories to Local Storage:', error);
    }
}

/**
 * Save theme preference to Local Storage
 */
function saveThemePreference(theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        console.log(`Saved theme preference: ${theme}`);
    } catch (error) {
        console.error('Error saving theme preference:', error);
    }
}

// === TRANSACTION OPERATIONS ===

/**
 * Generate a unique transaction ID
 * Uses crypto.randomUUID() with fallback to timestamp + random string
 */
function generateTransactionId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for browsers without crypto.randomUUID
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Validate form inputs
 * Returns error messages object or null if valid
 */
function validateFormInputs(name, amount, category) {
    const errors = {};
    
    // Validate item name
    if (!name || name.trim() === '') {
        errors.name = 'Item name is required';
    }
    
    // Validate amount
    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
        errors.amount = 'Amount must be a positive number';
    }
    
    // Validate category
    if (!category || category === '') {
        errors.category = 'Please select a category';
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Add a new transaction to the array
 */
function addTransaction(name, amount, category) {
    const transaction = {
        id: generateTransactionId(),
        name: name.trim(),
        amount: parseFloat(amount),
        category: category,
        date: new Date().toISOString()
    };
    
    transactions.unshift(transaction); // Add to beginning (newest first)
    saveTransactions();
    console.log('Added transaction:', transaction);
    
    renderUI();
    return transaction;
}

/**
 * Delete a transaction by ID
 */
function deleteTransaction(id) {
    const initialLength = transactions.length;
    transactions = transactions.filter(tx => tx.id !== id);
    
    if (transactions.length < initialLength) {
        saveTransactions();
        console.log('Deleted transaction with ID:', id);
        renderUI();
        return true;
    }
    
    console.log('Transaction not found with ID:', id);
    return false;
}

// === CATEGORY MANAGEMENT ===

/**
 * Check if category name is valid (not empty and not duplicate)
 */
function isValidCategoryName(categoryName) {
    const trimmedName = categoryName.trim();
    
    // Check if empty
    if (!trimmedName) {
        return { valid: false, error: 'Category name cannot be empty' };
    }
    
    // Check if already exists (case-insensitive)
    const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];
    const exists = allCategories.some(cat => 
        cat.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (exists) {
        return { valid: false, error: 'Category already exists' };
    }
    
    return { valid: true, name: trimmedName };
}

/**
 * Add a custom category
 */
function addCustomCategory(categoryName) {
    const validation = isValidCategoryName(categoryName);
    if (!validation.valid) {
        return { success: false, error: validation.error };
    }
    
    const newCategory = validation.name;
    customCategories.push(newCategory);
    saveCustomCategories();
    console.log('Added custom category:', newCategory);
    
    // Update category dropdown and list
    updateCategoryDropdown();
    renderCategoriesList();
    
    return { success: true, category: newCategory };
}

/**
 * Delete a custom category
 */
function deleteCustomCategory(categoryName) {
    const initialLength = customCategories.length;
    customCategories = customCategories.filter(cat => cat !== categoryName);
    
    if (customCategories.length < initialLength) {
        saveCustomCategories();
        console.log('Deleted custom category:', categoryName);
        
        // Update category dropdown and list
        updateCategoryDropdown();
        renderCategoriesList();
        
        return true;
    }
    
    console.log('Custom category not found:', categoryName);
    return false;
}

/**
 * Get all categories (default + custom)
 */
function getAllCategories() {
    return [...DEFAULT_CATEGORIES, ...customCategories];
}

/**
 * Update category dropdown with all available categories
 */
function updateCategoryDropdown() {
    if (!categorySelect) return;
    
    // Save current selection
    const currentValue = categorySelect.value;
    
    // Clear dropdown except first option
    categorySelect.innerHTML = '<option value="" disabled selected>Select category</option>';
    
    // Add default categories
    DEFAULT_CATEGORIES.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // Add custom categories
    if (customCategories.length > 0) {
        // Add separator if there are custom categories
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '──────────';
        categorySelect.appendChild(separator);
        
        customCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            option.className = 'custom-category';
            categorySelect.appendChild(option);
        });
    }
    
    // Restore selection if it still exists
    if (currentValue && getAllCategories().includes(currentValue)) {
        categorySelect.value = currentValue;
    }
}

/**
 * Render categories list in management section
 */
function renderCategoriesList() {
    const categoriesList = document.getElementById('categoriesList');
    if (!categoriesList) return;
    
    categoriesList.innerHTML = '';
    
    // Add default categories
    const defaultContainer = document.createElement('div');
    defaultContainer.className = 'default-categories';
    
    DEFAULT_CATEGORIES.forEach(category => {
        const tag = document.createElement('span');
        tag.className = `category-tag ${category.toLowerCase()}`;
        tag.textContent = category;
        defaultContainer.appendChild(tag);
    });
    
    categoriesList.appendChild(defaultContainer);
    
    // Add custom categories if any
    if (customCategories.length > 0) {
        const customContainer = document.createElement('div');
        customContainer.className = 'custom-categories';
        customContainer.style.marginTop = 'var(--spacing-sm)';
        
        customCategories.forEach(category => {
            const tag = document.createElement('span');
            tag.className = 'category-tag custom';
            tag.innerHTML = `
                ${escapeHtml(category)}
                <button class="delete-category-btn" data-category="${escapeHtml(category)}" aria-label="Delete category">×</button>
            `;
            
            // Add delete event listener
            const deleteBtn = tag.querySelector('.delete-category-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (deleteCustomCategory(category)) {
                    // Note: Don't call renderUI() here as it would refresh the whole UI
                    // The deleteCustomCategory already calls renderCategoriesList()
                }
            });
            
            customContainer.appendChild(tag);
        });
        
        categoriesList.appendChild(customContainer);
    }
}

// === MONTHLY SUMMARY ===

/**
 * Get month name from month number (0-11)
 */
function getMonthName(month) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
}

/**
 * Format month and year for display
 */
function formatMonthYear(month, year) {
    return `${getMonthName(month)} ${year}`;
}

/**
 * Get transactions for current month
 */
function getTransactionsForCurrentMonth() {
    return transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });
}

/**
 * Calculate monthly total
 */
function calculateMonthlyTotal() {
    const monthlyTransactions = getTransactionsForCurrentMonth();
    return monthlyTransactions.reduce((total, tx) => total + tx.amount, 0);
}

/**
 * Calculate monthly average
 */
function calculateMonthlyAverage() {
    const monthlyTransactions = getTransactionsForCurrentMonth();
    if (monthlyTransactions.length === 0) return 0;
    return calculateMonthlyTotal() / monthlyTransactions.length;
}

/**
 * Update monthly summary display
 */
function updateMonthlySummary() {
    const monthYearElement = document.getElementById('currentMonthYear');
    const monthlyTotalElement = document.getElementById('monthlyTotalAmount');
    const transactionCountElement = document.getElementById('monthlyTransactionCount');
    const monthlyAverageElement = document.getElementById('monthlyAverageAmount');
    
    if (!monthYearElement || !monthlyTotalElement || !transactionCountElement || !monthlyAverageElement) {
        return;
    }
    
    // Update month/year display
    monthYearElement.textContent = formatMonthYear(currentMonth, currentYear);
    
    // Calculate monthly data
    const monthlyTransactions = getTransactionsForCurrentMonth();
    const monthlyTotal = calculateMonthlyTotal();
    const monthlyAverage = calculateMonthlyAverage();
    
    // Update display
    monthlyTotalElement.textContent = formatIDR(monthlyTotal);
    transactionCountElement.textContent = monthlyTransactions.length;
    monthlyAverageElement.textContent = formatIDR(monthlyAverage);
    
    console.log(`Monthly summary updated: ${monthlyTransactions.length} transactions, total: ${formatIDR(monthlyTotal)}`);
}

/**
 * Navigate to previous month
 */
function goToPreviousMonth() {
    if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
    } else {
        currentMonth--;
    }
    updateMonthlySummary();
}

/**
 * Navigate to next month
 */
function goToNextMonth() {
    if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
    } else {
        currentMonth++;
    }
    updateMonthlySummary();
}

// === THEME MANAGEMENT ===

/**
 * Apply theme to the document
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update theme toggle button icon
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const themeIcon = themeToggle.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }
    
    // Update Chart.js theme if chart exists
    if (chartInstance) {
        updateChartTheme(theme);
    }
    
    console.log(`Theme applied: ${theme}`);
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    applyTheme(newTheme);
    saveThemePreference(newTheme);
}

/**
 * Update Chart.js colors based on theme
 */
function updateChartTheme(theme) {
    if (!chartInstance) return;
    
    // Update chart text color based on theme
    const textColor = theme === 'dark' ? '#f9fafb' : '#1f2937';
    const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
    
    chartInstance.options.plugins.legend.labels.color = textColor;
    chartInstance.options.plugins.tooltip.bodyColor = textColor;
    chartInstance.options.plugins.tooltip.titleColor = textColor;
    
    chartInstance.update();
}

// === FORM HANDLING ===

// DOM Elements
let expenseForm, itemNameInput, amountInput, categorySelect;
let newCategoryInput, addCategoryBtn;
let prevMonthBtn, nextMonthBtn, themeToggle;
let transactionsList, totalAmountElement, expenseChart;
let chartInstance = null;

/**
 * Initialize form event listeners
 */
function initializeForm() {
    expenseForm = document.getElementById('expenseForm');
    itemNameInput = document.getElementById('itemName');
    amountInput = document.getElementById('amount');
    categorySelect = document.getElementById('category');
    newCategoryInput = document.getElementById('newCategoryName');
    addCategoryBtn = document.getElementById('addCategoryBtn');
    prevMonthBtn = document.getElementById('prevMonthBtn');
    nextMonthBtn = document.getElementById('nextMonthBtn');
    themeToggle = document.getElementById('themeToggle');
    transactionsList = document.getElementById('transactionsList');
    totalAmountElement = document.getElementById('totalAmount');
    
    if (!expenseForm) {
        console.error('Expense form not found');
        return;
    }
    
    // Expense form event listener
    expenseForm.addEventListener('submit', handleFormSubmit);
    
    // Category management event listeners
    if (addCategoryBtn && newCategoryInput) {
        addCategoryBtn.addEventListener('click', handleAddCategory);
        newCategoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCategory();
            }
        });
    }
    
    // Monthly navigation event listeners
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', goToPreviousMonth);
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', goToNextMonth);
    }
    
    // Theme toggle event listener
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    console.log('Form, monthly navigation, and theme toggle initialized');
}

/**
 * Handle form submission
 */
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Clear previous error messages
    clearErrorMessages();
    
    // Get form values
    const name = itemNameInput.value;
    const amount = amountInput.value;
    const category = categorySelect.value;
    
    // Validate inputs
    const errors = validateFormInputs(name, amount, category);
    if (errors) {
        displayErrors(errors);
        return;
    }
    
    // Add transaction
    addTransaction(name, amount, category);
    
    // Clear form
    expenseForm.reset();
    console.log('Form submitted successfully');
}

/**
 * Handle add category button click
 */
function handleAddCategory() {
    if (!newCategoryInput) return;
    
    // Clear previous error
    const errorElement = document.getElementById('categoryNameError');
    if (errorElement) {
        errorElement.textContent = '';
    }
    
    const categoryName = newCategoryInput.value;
    const result = addCustomCategory(categoryName);
    
    if (result.success) {
        // Clear input
        newCategoryInput.value = '';
        // Focus back on input for quick adding
        newCategoryInput.focus();
    } else {
        // Show error
        if (errorElement) {
            errorElement.textContent = result.error;
        }
    }
}

/**
 * Clear all error messages
 */
function clearErrorMessages() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => el.textContent = '');
}

/**
 * Display validation errors
 */
function displayErrors(errors) {
    if (errors.name) {
        document.getElementById('itemNameError').textContent = errors.name;
    }
    if (errors.amount) {
        document.getElementById('amountError').textContent = errors.amount;
    }
    if (errors.category) {
        document.getElementById('categoryError').textContent = errors.category;
    }
}

// === UI RENDERING ===

/**
 * Format amount as Indonesian Rupiah (IDR)
 */
function formatIDR(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Format ISO date to localized date string
 */
function formatDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Calculate total expenses from transactions array
 */
function calculateTotalExpenses() {
    return transactions.reduce((total, tx) => total + tx.amount, 0);
}

/**
 * Create category data for chart
 */
function getCategoryData() {
    const allCategories = getAllCategories();
    const data = allCategories.map(category => {
        const total = transactions
            .filter(tx => tx.category === category)
            .reduce((sum, tx) => sum + tx.amount, 0);
        return total;
    });
    
    // Generate colors: default categories get their colors, custom categories get sequential colors
    const defaultColors = ['#10b981', '#3b82f6', '#f59e0b']; // green, blue, orange
    const customColors = ['#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16']; // purple, pink, teal, orange, lime
    
    const backgroundColor = allCategories.map((category, index) => {
        if (index < DEFAULT_CATEGORIES.length) {
            return defaultColors[index];
        } else {
            return customColors[(index - DEFAULT_CATEGORIES.length) % customColors.length];
        }
    });
    
    return {
        labels: allCategories,
        datasets: [{
            data: data,
            backgroundColor: backgroundColor,
            borderWidth: 1
        }]
    };
}

/**
 * Initialize or update Chart.js pie chart
 */
function updateChart() {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) {
        console.error('Chart canvas not found');
        return;
    }
    
    const chartData = getCategoryData();
    const currentTheme = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
    const textColor = currentTheme === 'dark' ? '#f9fafb' : '#1f2937';
    
    if (chartInstance) {
        chartInstance.data.labels = chartData.labels;
        chartInstance.data.datasets[0].data = chartData.datasets[0].data;
        chartInstance.data.datasets[0].backgroundColor = chartData.datasets[0].backgroundColor;
        chartInstance.options.plugins.legend.labels.color = textColor;
        chartInstance.options.plugins.tooltip.bodyColor = textColor;
        chartInstance.options.plugins.tooltip.titleColor = textColor;
        chartInstance.update();
    } else {
        chartInstance = new Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            font: {
                                family: 'Inter'
                            }
                        }
                    },
                    tooltip: {
                        bodyColor: textColor,
                        titleColor: textColor,
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = calculateTotalExpenses();
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${formatIDR(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

/**
 * Render individual transaction item
 */
function renderTransactionItem(transaction) {
    const item = document.createElement('div');
    item.className = 'transaction-item';
    item.dataset.id = transaction.id;
    
    // Get icon based on category
    const categoryIcon = getCategoryIcon(transaction.category);
    const categoryClass = transaction.category.toLowerCase();
    
    item.innerHTML = `
        <div class="transaction-icon ${categoryClass}">${categoryIcon}</div>
        <div class="transaction-content">
            <div class="transaction-header">
                <span class="transaction-name">${escapeHtml(transaction.name)}</span>
                <span class="transaction-amount">${formatIDR(transaction.amount)}</span>
            </div>
            <div class="transaction-details">
                <span class="transaction-category ${categoryClass}">${escapeHtml(transaction.category)}</span>
                <span class="transaction-date">${formatDate(transaction.date)}</span>
            </div>
        </div>
        <button class="delete-btn" aria-label="Delete transaction"></button>
    `;
    
    // Add delete event listener
    const deleteBtn = item.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        if (deleteTransaction(transaction.id)) {
            renderUI();
        }
    });
    
    return item;
}

/**
 * Get icon for category
 */
function getCategoryIcon(category) {
    const lowerCategory = category.toLowerCase();
    switch(lowerCategory) {
        case 'food':
            return '🍔';
        case 'transport':
            return '🚗';
        case 'fun':
            return '🎬';
        default:
            // For custom categories, use generic icon
            return '💰';
    }
}

/**
 * Simple HTML escaping for safe textContent usage
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Render transaction list
 */
function renderTransactionList() {
    if (!transactionsList) return;
    
    // Clear current list
    transactionsList.innerHTML = '';
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="empty-state">
                <p>No expenses yet. Add your first expense above!</p>
            </div>
        `;
        return;
    }
    
    // Render each transaction (already newest first from addTransaction)
    transactions.forEach(tx => {
        transactionsList.appendChild(renderTransactionItem(tx));
    });
}

/**
 * Render total expenses
 */
function renderTotal() {
    if (!totalAmountElement) return;
    
    const total = calculateTotalExpenses();
    totalAmountElement.textContent = formatIDR(total);
}

/**
 * Main UI rendering function
 */
function renderUI() {
    renderTransactionList();
    renderTotal();
    updateChart();
    updateMonthlySummary();
    console.log('UI rendered');
}

// === INITIALIZATION ===

// Load transactions, categories, and theme from Local Storage on page load
function initializeData() {
    transactions = loadTransactions();
    customCategories = loadCustomCategories();
    
    console.log('Application initialized with', transactions.length, 'transactions');
    console.log('Loaded', customCategories.length, 'custom categories');
    
    // Initialize form after data is loaded
    initializeForm();
    
    // Update category dropdown with loaded categories
    updateCategoryDropdown();
    renderCategoriesList();
    
    // Apply saved theme
    const savedTheme = loadThemePreference();
    applyTheme(savedTheme);
    
    // Render initial UI
    renderUI();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeData);

// === EXPORT FOR TESTING ===
// Make functions available for testing
window.testAddTransaction = addTransaction;
window.testDeleteTransaction = deleteTransaction;
window.testValidateFormInputs = validateFormInputs;
window.testAddCustomCategory = addCustomCategory;
window.testDeleteCustomCategory = deleteCustomCategory;
window.testToggleTheme = toggleTheme;
window.testGoToPreviousMonth = goToPreviousMonth;
window.testGoToNextMonth = goToNextMonth;