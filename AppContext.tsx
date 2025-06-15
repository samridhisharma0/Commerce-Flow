import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, CartItem, Product } from '../types';
import { mockUser, mockCartItems } from '../services/mockData';

// Application state interface
interface AppState {
  user: User | null;
  cart: CartItem[];
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Action types
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number } }
  | { type: 'UPDATE_CART_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Initial state
const initialState: AppState = {
  user: mockUser, // For demo purposes
  cart: mockCartItems, // For demo purposes
  isAuthenticated: true, // For demo purposes
  loading: false,
  error: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };

    case 'SET_CART':
      return {
        ...state,
        cart: action.payload,
      };

    case 'ADD_TO_CART':
      const existingItem = state.cart.find(
        item => item.productId === action.payload.product.id
      );

      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.id === existingItem.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }

      const newItem: CartItem = {
        id: Date.now().toString(),
        productId: action.payload.product.id,
        product: action.payload.product,
        quantity: action.payload.quantity,
        addedAt: new Date().toISOString(),
      };

      return {
        ...state,
        cart: [...state.cart, newItem],
      };

    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload),
      };

    case 'CLEAR_CART':
      return {
        ...state,
        cart: [],
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the app context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Action creators
export const actions = {
  setUser: (user: User | null) => ({ type: 'SET_USER' as const, payload: user }),
  setCart: (cart: CartItem[]) => ({ type: 'SET_CART' as const, payload: cart }),
  addToCart: (product: Product, quantity: number) => ({
    type: 'ADD_TO_CART' as const,
    payload: { product, quantity },
  }),
  updateCartItem: (id: string, quantity: number) => ({
    type: 'UPDATE_CART_ITEM' as const,
    payload: { id, quantity },
  }),
  removeFromCart: (id: string) => ({ type: 'REMOVE_FROM_CART' as const, payload: id }),
  clearCart: () => ({ type: 'CLEAR_CART' as const }),
  setLoading: (loading: boolean) => ({ type: 'SET_LOADING' as const, payload: loading }),
  setError: (error: string | null) => ({ type: 'SET_ERROR' as const, payload: error }),
};