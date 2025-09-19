# PayPal Checkout Fix Instructions

You are absolutely right to be frustrated. My apologies for the repeated failures. The tool interactions are clearly not working as intended, and I have failed to complete the task.

Here is a clear, step-by-step guide with the exact code changes required. You can provide this to another agent or perform the changes yourself.

### **Summary of the Fix**

The error is caused by a conflict between a client-side PayPal implementation in `checkout.html` and an unused server-side implementation in `server.js`. The fix is to make the client-side code use the server-side code, creating a single, consistent process.

---

### **Step 1: Modify `pages/checkout.html`**

This change will make the PayPal buttons call your server to create and approve the order.

1.  **Open the file:** `C:\WebsiteProject\PLWGCREATIVEAPPAREL\pages\checkout.html`
2.  **Find and DELETE** the following block of JavaScript code (it's inside the `<script>` tag at the bottom):

    ```javascript
    // Initialize PayPal
    function initializePayPal() {
        console.log('🔍 Checking PayPal SDK availability...');
        if (typeof paypal === 'undefined') {
            console.error('❌ PayPal SDK not loaded');
            return;
        }
        
        // Prevent multiple initializations
        if (paypalInitialized) {
            console.log('⚠️ PayPal already initialized, skipping...');
            return;
        }
        
        console.log('✅ PayPal SDK is available, creating buttons...');
        paypalInitialized = true;
        
        // Clear any existing PayPal buttons
        const container = document.getElementById('paypal-button-container');
        if (container) {
            container.innerHTML = '';
        }

        paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'pay',
                height: 45
            },
            // Enable all payment methods including credit/debit cards
            enableFunding: 'venmo,paylater,card',
            createOrder: function(data, actions) {
                // Validate shipping information before creating order
                if (!validateShippingInfoWithAlerts()) {
                    return Promise.reject('Please complete all required shipping information.');
                }

                // Validate order data
                if (!orderData || !orderData.items || !Array.isArray(orderData.items)) {
                    console.error('❌ Invalid order data:', orderData);
                    return Promise.reject('Order data is not available. Please refresh the page and try again.');
                }

                console.log('🛒 Creating PayPal order with items:', orderData.items);

                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            currency_code: 'USD',
                            value: window.orderTotal.toFixed(2),
                            breakdown: {
                                item_total: {
                                    currency_code: 'USD',
                                    value: window.orderSubtotal.toFixed(2)
                                },
                                shipping: {
                                    currency_code: 'USD',
                                    value: window.orderShipping.toFixed(2)
                                },
                                tax_total: {
                                    currency_code: 'USD',
                                    value: window.orderTax.toFixed(2)
                                }
                            }
                        },
                        items: orderData.items.map(item => ({
                            name: item.product_name,
                            unit_amount: {
                                currency_code: 'USD',
                                value: parseFloat(item.unit_price).toFixed(2)
                            },
                            quantity: item.quantity.toString()
                        }))
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    paypalOrderId = details.id;
                    processOrder(details);
                });
            },
            onError: function(err) {
                console.error('PayPal error:', err);
                showMessage('Payment failed. Please try again.', 'error');
            },
            onCancel: function(data) {
                console.log('Payment cancelled');
                showMessage('Payment was cancelled.', 'error');
            }
        }).render('#paypal-button-container');
    }

    // Process order after successful payment
    async function processOrder(paymentDetails) {
        try {
            showLoadingOverlay(true);

            const token = localStorage.getItem('customerToken');
            const shippingData = getShippingData();

            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    shipping_address: shippingData,
                    payment_method: 'paypal',
                    payment_id: paypalOrderId,
                    payment_details: paymentDetails
                })
            });

            if (response.ok) {
                const result = await response.json();
                showMessage('Order placed successfully!', 'success');
                
                // Save shipping address for future use
                await saveShippingAddress();
                
                // Redirect to success page with order details
                setTimeout(() => {
                    const totalAmount = window.orderTotal ? window.orderTotal.toFixed(2) : '0.00';
                    const paymentMethod = 'PayPal';
                    const redirectUrl = `order-success.html?order=${result.orderNumber}&total=$${totalAmount}&payment=${paymentMethod}`;
                    
                    console.log('🎉 Redirecting to success page with:', {
                        orderNumber: result.orderNumber,
                        totalAmount: totalAmount,
                        paymentMethod: paymentMethod,
                        redirectUrl: redirectUrl
                    });
                    
                    window.location.href = redirectUrl;
                }, 2000);
            } else {
                const errorData = await response.json();
                showMessage('Order failed: ' + (errorData.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error processing order:', error);
            showMessage('Error processing order. Please try again.', 'error');
        } finally {
            showLoadingOverlay(false);
        }
    }
    '''
3.  **In the exact same spot, PASTE** the following new code:

    '''javascript
    // Initialize PayPal
    function initializePayPal() {
        console.log('🔍 Checking PayPal SDK availability...');
        if (typeof paypal === 'undefined') {
            console.error('❌ PayPal SDK not loaded');
            return;
        }
        
        if (paypalInitialized) {
            console.log('⚠️ PayPal already initialized, skipping...');
            return;
        }
        
        console.log('✅ PayPal SDK is available, creating buttons...');
        paypalInitialized = true;
        
        const container = document.getElementById('paypal-button-container');
        if (container) {
            container.innerHTML = '';
        }

        paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'pay',
                height: 45
            },
            enableFunding: 'venmo,paylater,card',
            
            // createOrder: Uses the server-side /api/paypal/create-order endpoint
            createOrder: async (data, actions) => {
                console.log('🎬 Initiating server-side order creation...');
                if (!validateShippingInfoWithAlerts()) {
                    showMessage('Please complete all required shipping information before proceeding.', 'error');
                    return Promise.reject('Shipping information is invalid.');
                }

                try {
                    const token = localStorage.getItem('customerToken');
                    const response = await fetch('/api/paypal/create-order', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            shipping_address: getShippingData()
                        })
                    });

                    const order = await response.json();

                    if (response.ok) {
                        console.log('✅ PayPal Order ID from server:', order.id);
                        return order.id;
                    } else {
                        console.error('❌ Server failed to create PayPal order:', order);
                        showMessage(order.error || 'Could not initiate PayPal payment.', 'error');
                        return Promise.reject(order.error);
                    }
                } catch (error) {
                    console.error('❌ Network error during order creation:', error);
                    showMessage('A network error occurred. Please try again.', 'error');
                    return Promise.reject(error);
                }
            },

            // onApprove: Captures the funds on the server-side
            onApprove: async (data, actions) => {
                console.log('👍 Order approved by user. Capturing payment on server...');
                showLoadingOverlay(true);

                try {
                    const token = localStorage.getItem('customerToken');
                    const response = await fetch('/api/paypal/capture-order', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            orderId: data.orderID 
                        })
                    });

                    const result = await response.json();

                    if (response.ok) {
                        console.log('🎉 Payment captured successfully:', result);
                        processOrder(result.orderNumber, result.finalTotal, 'PayPal');
                        return result;
                    } else {
                        console.error('❌ Server failed to capture payment:', result);
                        showMessage(result.error || 'Payment capture failed.', 'error');
                        showLoadingOverlay(false);
                        return Promise.reject(result.error);
                    }
                } catch (error) {
                    console.error('❌ Network error during payment capture:', error);
                    showMessage('A network error occurred while capturing the payment.', 'error');
                    showLoadingOverlay(false);
                    return Promise.reject(error);
                }
            },

            onError: function(err) {
                console.error('An error occurred with the PayPal button:', err);
                showMessage('An unexpected error occurred. Please try again.', 'error');
                showLoadingOverlay(false);
            },

            onCancel: function(data) {
                console.log('Payment was cancelled by the user.');
                showMessage('Payment was cancelled.', 'warning');
                showLoadingOverlay(false);
            }
        }).render('#paypal-button-container');
    }

    // Process order after successful payment
    async function processOrder(orderNumber, totalAmount, paymentMethod) {
        try {
            // The server has already created the order. We just need to redirect.
            showMessage('Order placed successfully!', 'success');
            
            // Save shipping address for future use
            await saveShippingAddress();
            
            // Redirect to success page with order details
            setTimeout(() => {
                const redirectUrl = `order-success.html?order=${orderNumber}&total=$${totalAmount}&payment=${paymentMethod}`;
                
                console.log('🎉 Redirecting to success page with:', {
                    orderNumber: orderNumber,
                    totalAmount: totalAmount,
                    paymentMethod: paymentMethod,
                    redirectUrl: redirectUrl
                });
                
                window.location.href = redirectUrl;
            }, 2000);

        } catch (error) {
            console.error('Error in final processing step:', error);
            showMessage('Error processing order. Please contact support.', 'error');
        } finally {
            showLoadingOverlay(false);
        }
    }
    '''

---

### **Step 2: Modify `server.js`**

These two small changes ensure the server sends back the data that the updated `checkout.html` script now expects.

1.  **Open the file:** `C:\WebsiteProject\PLWGCREATIVEAPPAREL\server.js`
2.  **Change 1: Fix the `create-order` response.**
    *   **Find** this block:
        ```javascript
        res.json({ 
          orderId: response.result.id,
          orderNumber: orderNumber,
          total: total
        });
        '''
    *   **Replace** it with this (changes `orderId` to `id`):
        '''javascript
        res.json({ 
          id: response.result.id,
          orderNumber: orderNumber,
          total: total
        });
        '''
3.  **Change 2: Fix the `capture-order` response.**
    *   **Find** this block:
        '''javascript
        res.json({ 
          message: 'Payment captured successfully', 
          order: order,
          orderNumber: order.order_number,
          paymentDetails: response.result
        });
        '''
    *   **Replace** it with this (adds the `finalTotal` line):
        '''javascript
        res.json({ 
          message: 'Payment captured successfully', 
          order: order,
          orderNumber: order.order_number,
          finalTotal: order.total_amount,
          paymentDetails: response.result
        });
        '''

After making these changes, the PayPal checkout flow should work correctly without the double pop-up.
