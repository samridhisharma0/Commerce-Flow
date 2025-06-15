// Mock data for demonstration - simulates microservices responses

import { Product, User, CartItem, Order } from '../types';

export const mockUser: User = {
  id: '1',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'customer',
  createdAt: '2024-01-15T10:00:00Z',
  preferences: {
    currency: 'USD',
    language: 'en',
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
  },
};

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and premium audio experience.',
    price: 299.99,
    originalPrice: 349.99,
    category: 'Electronics',
    subcategory: 'Audio',
    images: [
      'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    inventory: {
      available: 45,
      reserved: 5,
      total: 50,
    },
    ratings: {
      average: 4.8,
      count: 127,
    },
    tags: ['wireless', 'noise-cancellation', 'premium'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T12:30:00Z',
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracking with heart rate monitoring, GPS, and smartphone integration.',
    price: 199.99,
    category: 'Electronics',
    subcategory: 'Wearables',
    images: [
      'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    inventory: {
      available: 23,
      reserved: 2,
      total: 25,
    },
    ratings: {
      average: 4.6,
      count: 89,
    },
    tags: ['fitness', 'smartwatch', 'health'],
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-10T09:15:00Z',
  },
  {
    id: '3',
    name: 'Organic Cotton T-Shirt',
    description: 'Sustainable and comfortable organic cotton t-shirt in multiple colors.',
    price: 29.99,
    category: 'Clothing',
    subcategory: 'Shirts',
    images: [
      'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    variants: [
      { id: 'size-s', name: 'Size', value: 'S', inventory: 15 },
      { id: 'size-m', name: 'Size', value: 'M', inventory: 20 },
      { id: 'size-l', name: 'Size', value: 'L', inventory: 18 },
      { id: 'size-xl', name: 'Size', value: 'XL', inventory: 12 },
    ],
    inventory: {
      available: 65,
      reserved: 0,
      total: 65,
    },
    ratings: {
      average: 4.4,
      count: 203,
    },
    tags: ['organic', 'sustainable', 'cotton'],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-05T14:20:00Z',
  },
  {
    id: '4',
    name: 'Professional Camera',
    description: 'High-resolution digital camera perfect for professional photography and videography.',
    price: 1299.99,
    category: 'Electronics',
    subcategory: 'Cameras',
    images: [
      'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    inventory: {
      available: 8,
      reserved: 2,
      total: 10,
    },
    ratings: {
      average: 4.9,
      count: 45,
    },
    tags: ['professional', 'camera', 'photography'],
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-02-01T11:00:00Z',
  },
  {
    id: '5',
    name: 'Minimalist Desk Lamp',
    description: 'Modern LED desk lamp with adjustable brightness and color temperature.',
    price: 79.99,
    category: 'Home & Garden',
    subcategory: 'Lighting',
    images: [
      'https://images.pexels.com/photos/1145434/pexels-photo-1145434.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    inventory: {
      available: 32,
      reserved: 3,
      total: 35,
    },
    ratings: {
      average: 4.7,
      count: 156,
    },
    tags: ['minimalist', 'LED', 'adjustable'],
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-25T16:45:00Z',
  },
  {
    id: '6',
    name: 'Artisan Coffee Beans',
    description: 'Premium single-origin coffee beans roasted to perfection.',
    price: 24.99,
    category: 'Food & Beverages',
    subcategory: 'Coffee',
    images: [
      'https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    inventory: {
      available: 156,
      reserved: 12,
      total: 168,
    },
    ratings: {
      average: 4.5,
      count: 289,
    },
    tags: ['artisan', 'single-origin', 'premium'],
    createdAt: '2024-02-10T00:00:00Z',
    updatedAt: '2024-02-12T08:30:00Z',
  },
];

export const mockCartItems: CartItem[] = [
  {
    id: '1',
    productId: '1',
    product: mockProducts[0],
    quantity: 1,
    addedAt: '2024-02-15T10:30:00Z',
  },
  {
    id: '2',
    productId: '3',
    product: mockProducts[2],
    quantity: 2,
    variant: { id: 'size-m', name: 'Size', value: 'M', inventory: 20 },
    addedAt: '2024-02-15T11:15:00Z',
  },
];

export const mockOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    userId: '1',
    items: [
      {
        id: '1',
        productId: '2',
        product: mockProducts[1],
        quantity: 1,
        price: 199.99,
      },
    ],
    status: 'delivered',
    paymentStatus: 'completed',
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA',
    },
    totals: {
      subtotal: 199.99,
      tax: 16.00,
      shipping: 9.99,
      discount: 0,
      total: 225.98,
    },
    createdAt: '2024-01-20T14:30:00Z',
    updatedAt: '2024-01-25T09:15:00Z',
    trackingNumber: 'TRK123456789',
  },
];

// Categories for navigation
export const categories = [
  { id: 'electronics', name: 'Electronics', icon: '📱' },
  { id: 'clothing', name: 'Clothing', icon: '👕' },
  { id: 'home-garden', name: 'Home & Garden', icon: '🏠' },
  { id: 'food-beverages', name: 'Food & Beverages', icon: '🍕' },
  { id: 'books', name: 'Books', icon: '📚' },
  { id: 'sports', name: 'Sports & Outdoors', icon: '⚽' },
];