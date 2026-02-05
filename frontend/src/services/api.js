const API_URL = "http://localhost:4000";

export async function fetchProducts() {
  const res = await fetch(`${API_URL}/api/products`);
  return res.json();
}

export async function fetchDeliveries() {
  const res = await fetch(`${API_URL}/api/deliveries`);
  return res.json();
}

export async function fetchOrder(orderId) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}`);
  return res.json();
}

export async function createOrder(payload) {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function initPayment(orderId, provider = "paygate", totype = "TMoney") {
  const res = await fetch(`${API_URL}/api/payments/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_id: orderId, provider, totype })
  });
  return res.json();
}

export async function adminCreateProduct(data, adminKey) {
  const res = await fetch(`${API_URL}/api/admin/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function adminUploadImage(file, adminKey) {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${API_URL}/api/admin/upload`, {
    method: "POST",
    headers: {
      "x-admin-key": adminKey
    },
    body: form
  });
  return res.json();
}

export async function adminFetchOrders(adminKey) {
  const res = await fetch(`${API_URL}/api/admin/orders`, {
    headers: { "x-admin-key": adminKey }
  });
  return res.json();
}

export async function adminUpdateOrderStatus(orderId, status, adminKey) {
  const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey
    },
    body: JSON.stringify({ status })
  });
  return res.json();
}

export async function adminFetchDashboard(adminKey) {
  const res = await fetch(`${API_URL}/api/admin/dashboard`, {
    headers: { "x-admin-key": adminKey }
  });
  return res.json();
}

export async function adminCreateVariant(data, adminKey) {
  const res = await fetch(`${API_URL}/api/admin/variants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey
    },
    body: JSON.stringify(data)
  });
  return res.json();
}
