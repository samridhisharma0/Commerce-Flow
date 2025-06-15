import React from 'react';
import { Hero } from '../components/home/Hero';
import { FeaturedProducts } from '../components/home/FeaturedProducts';

export function Home() {
  return (
    <div className="animate-fade-in">
      <Hero />
      <FeaturedProducts />
      
      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">1M+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary-600 mb-2">50K+</div>
              <div className="text-gray-600">Products Available</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime Guarantee</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-gray-600">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose CommerceFlow?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with modern microservices architecture for scalability, performance, and reliability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Microservices Architecture
              </h3>
              <p className="text-gray-600">
                Scalable, maintainable, and fault-tolerant system design with independent service deployment.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-secondary-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Enterprise Security
              </h3>
              <p className="text-gray-600">
                PCI DSS compliance, OAuth2 authentication, and end-to-end encryption for maximum security.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Real-time Analytics
              </h3>
              <p className="text-gray-600">
                Comprehensive monitoring, logging, and analytics with Prometheus, Grafana, and ELK stack.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}