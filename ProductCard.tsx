import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Product } from '../../types';
import { useApp, actions } from '../../context/AppContext';

interface ProductCardProps {
  product: Product;
  showQuickActions?: boolean;
}

export function ProductCard({ product, showQuickActions = true }: ProductCardProps) {
  const { dispatch } = useApp();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(actions.addToCart(product, 1));
    // Show toast notification in real app
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Add to wishlist logic
  };

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
      <Link to={`/products/${product.id}`} className="block">
        {/* Image */}
        <div className="relative aspect-w-4 aspect-h-3 bg-gray-100 overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 space-y-1">
            {discount > 0 && (
              <span className="inline-block bg-accent-500 text-white text-xs font-semibold px-2 py-1 rounded">
                -{discount}%
              </span>
            )}
            {product.inventory.available < 10 && (
              <span className="inline-block bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                Low Stock
              </span>
            )}
          </div>

          {/* Quick Actions */}
          {showQuickActions && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
              <button
                onClick={handleAddToWishlist}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
                title="Add to wishlist"
              >
                <Heart className="h-4 w-4 text-gray-600" />
              </button>
              {product.inventory.available > 0 && (
                <button
                  onClick={handleAddToCart}
                  className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors"
                  title="Add to cart"
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.category}
          </p>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center space-x-1 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.ratings.average)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({product.ratings.count})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Inventory Status */}
          <div className="mt-2">
            {product.inventory.available === 0 ? (
              <span className="text-xs text-red-600 font-medium">Out of Stock</span>
            ) : product.inventory.available < 10 ? (
              <span className="text-xs text-orange-600 font-medium">
                Only {product.inventory.available} left
              </span>
            ) : (
              <span className="text-xs text-green-600 font-medium">In Stock</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}