import React, { useState, useEffect, FormEvent } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { PencilIcon } from './components/icons/PencilIcon';
import { TrashIcon } from './components/icons/TrashIcon';

// --- TYPE DEFINITIONS ---
interface User {
  id: number;
  name?: string;
  email?: string;
  username: string;
  password?: string; // Not stored in LS for security, but needed for signup
  role: 'admin' | 'user';
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [page, setPage] = useState<'login' | 'signup' | 'admin-dashboard' | 'user-home'>('login');
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Cart System States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  // --- LOCALSTORAGE PERSISTENCE ---
  useEffect(() => {
    // Load users from localStorage
    const storedUsers = localStorage.getItem('ecom_users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }

    // Load products from localStorage or set initial data
    const storedProducts = localStorage.getItem('ecom_products');
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    } else {
      // Seed with some initial products if none exist
      const initialProducts: Product[] = [
        { id: 1, name: 'Quantum Laptop', description: 'A laptop from the future with holographic display.', price: 2499.99, imageUrl: 'https://placehold.co/600x400/1e293b/94a3b8?text=Quantum+Laptop', stock: 10 },
        { id: 2, name: 'Singularity Mouse', description: 'Control your cursor with the power of your mind.', price: 149.50, imageUrl: 'https://placehold.co/600x400/1e293b/94a3b8?text=Singularity+Mouse', stock: 5 },
        { id: 3, name: 'Galactic Keyboard', description: 'Keys are made of stardust. Types in any language.', price: 499.00, imageUrl: 'https://placehold.co/600x400/1e293b/94a3b8?text=Galactic+Keyboard', stock: 0 },
      ];
      setProducts(initialProducts);
      localStorage.setItem('ecom_products', JSON.stringify(initialProducts));
    }
  }, []);

    // --- LOADING EFFECT ---
  useEffect(() => {
    if (isLoading && currentUser) {
      // Only for initial login loading
      if (checkoutStep === 'cart') { 
         const timer = setTimeout(() => {
            setIsLoading(false);
            setPage(currentUser.role === 'admin' ? 'admin-dashboard' : 'user-home');
         }, 3000);
         return () => clearTimeout(timer);
      }
    }
  }, [isLoading, currentUser, checkoutStep]);


  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    // Remove password before saving to localStorage
    const usersToStore = updatedUsers.map(({ password, ...user }) => user);
    localStorage.setItem('ecom_users', JSON.stringify(usersToStore));
  };

  const saveProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    localStorage.setItem('ecom_products', JSON.stringify(updatedProducts));
  };


  // --- AUTHENTICATION HANDLERS ---
  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const username = (e.currentTarget.elements.namedItem('username') as HTMLInputElement).value;
    const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;

    if (username === 'admin' && password === 'timeisgold') {
      const adminUser = { id: 0, username: 'admin', role: 'admin' as const };
      setCurrentUser(adminUser);
      setIsLoading(true);
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem('ecom_users') || '[]').find((u: User) => u.username === username);
    const storedPassword = localStorage.getItem(`ecom_user_${username}_pw`); // Mock password storage

    if (storedUser && storedPassword === password) {
      setCurrentUser(storedUser);
      setIsLoading(true);
    } else {
      setError('Invalid username or password');
    }
  };

  const handleSignup = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value;
    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
    const username = (e.currentTarget.elements.namedItem('username') as HTMLInputElement).value;
    const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
    const confirmPassword = (e.currentTarget.elements.namedItem('confirmPassword') as HTMLInputElement).value;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (users.some(u => u.username === username) || username === 'admin') {
      setError('Username already exists');
      return;
    }

    const newUser: User = {
        id: Date.now(),
        name,
        email,
        username,
        role: 'user',
    };
    saveUsers([...users, newUser]);
    // Mock storing password for login simulation
    localStorage.setItem(`ecom_user_${username}_pw`, password);
    setPage('login');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPage('login');
    setError('');
    setIsLoading(false);
    setCart([]);
    setIsCartOpen(false);
  };

  // --- PRODUCT CRUD HANDLERS ---
  const handleProductSubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const name = (e.currentTarget.elements.namedItem('productName') as HTMLInputElement).value;
      const description = (e.currentTarget.elements.namedItem('description') as HTMLTextAreaElement).value;
      const price = parseFloat((e.currentTarget.elements.namedItem('price') as HTMLInputElement).value);
      const stock = parseInt((e.currentTarget.elements.namedItem('stock') as HTMLInputElement).value, 10);
      const imageUrl = (e.currentTarget.elements.namedItem('imageUrl') as HTMLInputElement).value;

      if (editingProduct) {
          // Update existing product
          saveProducts(products.map(p => p.id === editingProduct.id ? { ...p, name, description, price, imageUrl, stock } : p));
      } else {
          // Add new product
          const newProduct: Product = { id: Date.now(), name, description, price, imageUrl, stock };
          saveProducts([...products, newProduct]);
      }
      setEditingProduct(null);
      e.currentTarget.reset();
  };

  const handleDeleteProduct = (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
        saveProducts(products.filter(p => p.id !== productId));
    }
  };

  // --- CART & CHECKOUT HANDLERS ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Don't exceed stock
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > item.product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Deduct stock
    const updatedProducts = products.map(product => {
      const cartItem = cart.find(item => item.product.id === product.id);
      if (cartItem) {
        return { ...product, stock: Math.max(0, product.stock - cartItem.quantity) };
      }
      return product;
    });
    
    saveProducts(updatedProducts);
    setCart([]);
    setIsLoading(false);
    setCheckoutStep('success');
  };

  // --- RENDER LOGIC ---
  const renderCartModal = () => {
    if (!isCartOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex justify-end">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>
        
        {/* Drawer */}
        <div className="relative w-full max-w-md h-full bg-slate-800 shadow-2xl shadow-purple-900/20 flex flex-col border-l border-slate-700 animate-slideInRight">
          {/* Header */}
          <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800">
            <h2 className="text-2xl font-bold text-white">
                {checkoutStep === 'cart' ? 'Your Cart' : checkoutStep === 'checkout' ? 'Checkout' : 'Order Status'}
            </h2>
            <button onClick={() => { setIsCartOpen(false); setTimeout(() => setCheckoutStep('cart'), 300); }} className="text-slate-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-y-auto p-6">
            {checkoutStep === 'cart' && (
              <>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex gap-4 items-start">
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-20 h-20 rounded-md object-cover bg-slate-700" />
                        <div className="flex-grow">
                          <h3 className="font-bold text-slate-100">{item.product.name}</h3>
                          <p className="text-cyan-400 font-semibold">${item.product.price.toFixed(2)}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center bg-slate-700 rounded hover:bg-slate-600">-</button>
                            <span className="text-sm w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.product.id, 1)} 
                              disabled={item.quantity >= item.product.stock}
                              className="w-6 h-6 flex items-center justify-center bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >+</button>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-300 p-1"><TrashIcon /></button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {checkoutStep === 'checkout' && (
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                  <input type="text" required className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-purple-500" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Shipping Address</label>
                  <textarea required className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-purple-500 h-24 resize-none" placeholder="123 Space Street, Mars Colony"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Card Number (Dummy)</label>
                  <input type="text" required className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-purple-500" placeholder="0000 0000 0000 0000" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-400 mb-1">Expiry</label>
                    <input type="text" required className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-purple-500" placeholder="MM/YY" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-400 mb-1">CVC</label>
                    <input type="text" required className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-purple-500" placeholder="123" />
                  </div>
                </div>
              </form>
            )}

            {checkoutStep === 'success' && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Order Placed!</h3>
                <p className="text-slate-400 mb-8">Thank you for your purchase. Your order is on its way to the coordinates provided.</p>
                <button onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); }} className="px-8 py-3 bg-slate-700 rounded-md font-bold hover:bg-slate-600 transition-colors">
                  Continue Shopping
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {checkoutStep !== 'success' && (
            <div className="p-6 border-t border-slate-700 bg-slate-800">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400">Total</span>
                <span className="text-2xl font-bold text-white">${cartTotal.toFixed(2)}</span>
              </div>
              {checkoutStep === 'cart' ? (
                <button 
                  onClick={() => setCheckoutStep('checkout')} 
                  disabled={cart.length === 0}
                  className="w-full py-3 bg-purple-600 rounded-md font-bold text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Checkout
                </button>
              ) : (
                <div className="flex gap-3">
                   <button 
                    type="button"
                    onClick={() => setCheckoutStep('cart')} 
                    className="flex-1 py-3 bg-slate-700 rounded-md font-bold text-white hover:bg-slate-600 transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    form="checkout-form"
                    disabled={isLoading}
                    className="flex-[2] py-3 bg-cyan-500 rounded-md font-bold text-white hover:bg-cyan-600 transition-colors disabled:opacity-70 flex justify-center items-center"
                  >
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : 'Pay Now'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };


  const renderPage = () => {
    // Initial App Loading (Login/Dashboard transition)
    if (isLoading && checkoutStep === 'cart' && !isCartOpen) {
      return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 sm:p-12 text-center shadow-2xl shadow-purple-500/10 flex flex-col items-center">
                <svg className="animate-spin h-16 w-16 text-purple-400 mb-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-6 animate-pulse">
                    Launching ShopDo
                </h1>
                <div className="text-slate-400 text-sm space-y-2">
                    <p>A web app made by the team</p>
                    <p className="font-semibold text-slate-300">Raja vel, Prithivi raj, sennan posali, Preetha</p>
                    <p>Hosted by <span className="font-semibold text-slate-300">Pk</span></p>
                </div>
            </div>
        </div>
      );
    }
    
    if (!currentUser) {
      if (page === 'signup') {
        // --- SIGNUP PAGE ---
        return (
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-center mb-6">Create Account</h1>
            <form onSubmit={handleSignup} className="bg-slate-800 p-8 rounded-lg shadow-xl shadow-purple-500/10">
              <div className="space-y-4">
                 <input name="name" type="text" placeholder="Name" required className="w-full p-3 bg-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 border border-transparent focus:border-purple-500" />
                 <input name="email" type="email" placeholder="Email" required className="w-full p-3 bg-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 border border-transparent focus:border-purple-500" />
                 <input name="username" type="text" placeholder="Username" required className="w-full p-3 bg-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 border border-transparent focus:border-purple-500" />
                 <input name="password" type="password" placeholder="Password" required className="w-full p-3 bg-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 border border-transparent focus:border-purple-500" />
                 <input name="confirmPassword" type="password" placeholder="Confirm Password" required className="w-full p-3 bg-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 border border-transparent focus:border-purple-500" />
              </div>
              {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
              <button type="submit" className="w-full mt-6 py-3 bg-purple-600 rounded-md font-bold hover:bg-purple-700 transition-all transform hover:scale-105">Sign Up</button>
              <p className="text-center text-sm text-slate-400 mt-4">
                Already have an account? <button onClick={() => setPage('login')} className="text-cyan-400 hover:underline">Login</button>
              </p>
            </form>
          </div>
        );
      }
      // --- LOGIN PAGE ---
      return (
          <div className="w-full max-w-sm mx-auto">
            <h1 className="text-3xl font-bold text-center mb-6">Login</h1>
            <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-lg shadow-xl shadow-cyan-500/10">
              <div className="space-y-4">
                <input name="username" type="text" placeholder="Username" required className="w-full p-3 bg-slate-700 rounded-md focus:ring-2 focus:ring-cyan-500 border border-transparent focus:border-cyan-500" />
                <input name="password" type="password" placeholder="Password" required className="w-full p-3 bg-slate-700 rounded-md focus:ring-2 focus:ring-cyan-500 border border-transparent focus:border-cyan-500" />
              </div>
              {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
              <button type="submit" className="w-full mt-6 py-3 bg-cyan-500 rounded-md font-bold hover:bg-cyan-600 transition-all transform hover:scale-105">Login</button>
              <p className="text-center text-sm text-slate-400 mt-4">
                Don't have an account? <button onClick={() => setPage('signup')} className="text-purple-400 hover:underline">Sign Up</button>
              </p>
            </form>
          </div>
      );
    }

    if (currentUser.role === 'admin') {
      // --- ADMIN DASHBOARD ---
      return (
        <div className="w-full max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
            
            {/* Add/Edit Product Form */}
            <div className="bg-slate-800 p-6 rounded-lg mb-8 border border-slate-700">
                <h2 className="text-2xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input name="productName" type="text" placeholder="Product Name" required defaultValue={editingProduct?.name} className="md:col-span-1 p-3 bg-slate-700 rounded-md focus:ring-2 focus:ring-purple-500" />
                    <input name="price" type="number" step="0.01" placeholder="Price" required defaultValue={editingProduct?.price} className="md:col-span-1 p-3 bg-slate-700 rounded-md focus:ring-2 focus:ring-purple-500" />
                    <input name="stock" type="number" placeholder="Stock Quantity" required defaultValue={editingProduct?.stock} className="md:col-span-1 p-3 bg-slate-700 rounded-md focus:ring-2 focus:ring-purple-500" />
                    <textarea name="description" placeholder="Description" required defaultValue={editingProduct?.description} className="md:col-span-3 p-3 bg-slate-700 rounded-md focus:ring-2 focus:ring-purple-500 h-24 resize-none"></textarea>
                    <input name="imageUrl" type="text" placeholder="Image URL (optional)" defaultValue={editingProduct?.imageUrl} className="md:col-span-3 p-3 bg-slate-700 rounded-md focus:ring-2 focus:ring-purple-500" />
                    <div className="md:col-span-3 flex gap-4">
                        <button type="submit" className="px-6 py-2 bg-purple-600 rounded-md font-bold hover:bg-purple-700 transition-colors">{editingProduct ? 'Update Product' : 'Add Product'}</button>
                        {editingProduct && <button type="button" onClick={() => { setEditingProduct(null); (document.querySelector('form') as HTMLFormElement).reset(); }} className="px-6 py-2 bg-slate-600 rounded-md font-bold hover:bg-slate-500 transition-colors">Cancel Edit</button>}
                    </div>
                </form>
            </div>

            {/* Product List */}
            <h2 className="text-2xl font-bold mb-4">Product List</h2>
            <div className="space-y-4">
              {products.map(product => {
                const isOutOfStock = product.stock === 0;
                return (
                    <div key={product.id} className={`p-4 rounded-lg flex items-center justify-between gap-4 border transition-colors ${isOutOfStock ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-800 border-slate-700'}`}>
                        <div className="flex items-center gap-4 flex-grow">
                            <img src={product.imageUrl || 'https://placehold.co/100x100/1e293b/94a3b8?text=Image'} alt={product.name} className={`w-16 h-16 rounded-md object-cover flex-shrink-0 transition-all ${isOutOfStock ? 'grayscale' : ''}`} />
                            <div className="flex-grow">
                                <h3 className={`font-bold text-lg ${isOutOfStock ? 'text-slate-400' : 'text-slate-100'}`}>{product.name}</h3>
                                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                                    <span>${product.price.toFixed(2)}</span>
                                    <span>&middot;</span>
                                    <span>Stock: {product.stock}</span>
                                    {isOutOfStock ? (
                                        <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-red-500/20 text-red-400">
                                            Out of Stock
                                        </span>
                                    ) : product.stock <= 5 && (
                                        <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-yellow-500/20 text-yellow-400">
                                            Low Stock
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => setEditingProduct(product)} className="p-2 text-sm text-cyan-300 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors"><PencilIcon /></button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-sm text-red-400 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors"><TrashIcon /></button>
                        </div>
                    </div>
                );
              })}
            </div>
        </div>
      );
    }
    
    if (currentUser.role === 'user') {
      // --- USER HOME PAGE ---
      const displayedProducts = products.filter(p => showInStockOnly ? p.stock > 0 : true);

      return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold">Products</h1>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="stockFilter" 
                  checked={showInStockOnly} 
                  onChange={(e) => setShowInStockOnly(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-slate-700" 
                />
                <label htmlFor="stockFilter" className="text-slate-300 cursor-pointer select-none">In Stock Only</label>
              </div>
            </div>
            
            {displayedProducts.length === 0 ? (
               <div className="text-center py-20 text-slate-500">
                 <p className="text-xl">No products found.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {displayedProducts.map(product => {
                  const isOutOfStock = product.stock === 0;
                  return (
                    <div key={product.id} className={`bg-slate-800 rounded-lg shadow-lg overflow-hidden group transition-all duration-300 ${!isOutOfStock && 'hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/25'}`}>
                      <div className="relative h-48 overflow-hidden">
                        <img src={product.imageUrl || 'https://placehold.co/600x400/1e293b/94a3b8?text=Product'} alt={product.name} className={`w-full h-full object-cover transition-transform duration-500 ease-in-out ${!isOutOfStock && 'group-hover:scale-110'} ${isOutOfStock ? 'grayscale' : ''}`} />
                        {isOutOfStock && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-white font-bold tracking-wider border-2 border-white rounded-md px-4 py-2">OUT OF STOCK</span>
                              </div>
                          )}
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-2">
                              <h2 className="text-xl font-bold truncate pr-2 flex-grow">{product.name}</h2>
                              <span className={`mt-1 flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full ${isOutOfStock ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                  {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                              </span>
                          </div>
                        <p className="text-slate-400 text-sm h-10 overflow-hidden flex-grow">{product.description}</p>
                        <div className="flex justify-between items-center mt-4">
                          <p className="text-lg font-black text-cyan-400">${product.price.toFixed(2)}</p>
                          <button 
                            onClick={() => addToCart(product)}
                            disabled={isOutOfStock} 
                            className="px-4 py-2 bg-purple-600 rounded-md font-bold text-sm hover:bg-purple-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
                          >
                            {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        onNavigate={setPage} 
        cartItemCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex flex-col justify-center items-center relative">
        {renderPage()}
      </main>
      {renderCartModal()}
      <Footer />
    </div>
  );
};

export default App;