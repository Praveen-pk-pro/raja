
import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { PencilIcon } from './components/icons/PencilIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import { SearchIcon } from './components/icons/SearchIcon';
import { StarIcon } from './components/icons/StarIcon';
import { HeartIcon } from './components/icons/HeartIcon';
import { ArrowLeftIcon } from './components/icons/ArrowLeftIcon';

// --- TYPE DEFINITIONS ---
interface User {
  id: number;
  name?: string;
  email?: string;
  username: string;
  password?: string; 
  role: 'admin' | 'user';
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  stock: number;
  // New fields for "Everything Missing"
  category: string;
  rating: number;
  reviewCount: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered';
}

interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

// Dummy Reviews Data Generator
const getDummyReviews = (productId: number): Review[] => [
  { id: 1, user: "Alex K.", rating: 5, comment: "Absolutely love this! Best purchase I've made all year.", date: "2 days ago" },
  { id: 2, user: "Sam M.", rating: 4, comment: "Great quality, but shipping took a bit longer than expected.", date: "1 week ago" },
  { id: 3, user: "Jordan P.", rating: 5, comment: "Exactly as described. Highly recommend.", date: "2 weeks ago" },
];

// --- TOAST COMPONENT ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-4 right-4 z-[200] px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 transform transition-all animate-slideUp ${type === 'success' ? 'bg-slate-800 border border-green-500/30 text-green-400' : 'bg-slate-800 border border-red-500/30 text-red-400'}`}>
            {type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )}
            <span className="font-medium text-slate-200">{message}</span>
        </div>
    );
};

// --- GLOBAL LOADER COMPONENT ---
const GlobalLoader = () => {
    const teammates = ['Alex', 'Jordan', 'Casey', 'Taylor', 'Jamie', 'Morgan'];
    // We use useMemo to keep the name stable during a single loading instance if desired, 
    // or just let it re-render. Simple random selection here.
    const teammate = teammates[Math.floor(Date.now() / 1000) % teammates.length];
    
    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fadeIn">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Processing...</h2>
            <p className="text-cyan-400 font-mono tracking-widest uppercase text-sm animate-pulse">
                teAM MATE: {teammate}
            </p>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [page, setPage] = useState<'login' | 'signup' | 'admin-dashboard' | 'user-home' | 'product-details' | 'profile' | 'wishlist'>('login');
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Admin State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // User Interactions
  const [activeProduct, setActiveProduct] = useState<Product | null>(null); // For details view
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  // UI States
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // --- LOCALSTORAGE PERSISTENCE ---
  useEffect(() => {
    // Users
    const storedUsers = localStorage.getItem('ecom_users');
    if (storedUsers) setUsers(JSON.parse(storedUsers));

    // Products
    const storedProducts = localStorage.getItem('ecom_products');
    if (storedProducts) {
      const parsedProducts = JSON.parse(storedProducts);
      // Migration logic: Add new fields if they don't exist
      const migratedProducts = parsedProducts.map((p: any) => ({
          ...p,
          category: p.category || ['Electronics', 'Wearables', 'Accessories', 'Home'][Math.floor(Math.random() * 4)],
          rating: p.rating || (Math.random() * 2 + 3), // Random 3-5 stars
          reviewCount: p.reviewCount || Math.floor(Math.random() * 50) + 5
      }));
      setProducts(migratedProducts);
    } else {
      // Seed Initial Data
      const initialProducts: Product[] = [
        { id: 1, name: 'Quantum Laptop', description: 'A laptop from the future with holographic display.', price: 2499.99, imageUrl: 'https://placehold.co/600x400/1e293b/94a3b8?text=Quantum+Laptop', stock: 10, category: 'Electronics', rating: 4.8, reviewCount: 124 },
        { id: 2, name: 'Singularity Mouse', description: 'Control your cursor with the power of your mind.', price: 149.50, imageUrl: 'https://placehold.co/600x400/1e293b/94a3b8?text=Singularity+Mouse', stock: 5, category: 'Accessories', rating: 4.2, reviewCount: 45 },
        { id: 3, name: 'Galactic Keyboard', description: 'Keys are made of stardust. Types in any language.', price: 499.00, imageUrl: 'https://placehold.co/600x400/1e293b/94a3b8?text=Galactic+Keyboard', stock: 0, category: 'Accessories', rating: 4.9, reviewCount: 89 },
        { id: 4, name: 'Nebula Smartwatch', description: 'Tracks time across dimensions.', price: 299.99, imageUrl: 'https://placehold.co/600x400/1e293b/94a3b8?text=Nebula+Watch', stock: 15, category: 'Wearables', rating: 4.5, reviewCount: 62 },
        { id: 5, name: 'Void Noise Cancelling', description: 'Silence absolute. Hear the cosmos.', price: 349.00, imageUrl: 'https://placehold.co/600x400/1e293b/94a3b8?text=Void+Headphones', stock: 8, category: 'Electronics', rating: 4.7, reviewCount: 210 },
        { id: 6, name: 'Zero-G Chair', description: 'Floating ergonomic chair for deep focus.', price: 899.99, imageUrl: 'https://placehold.co/600x400/1e293b/94a3b8?text=Zero-G+Chair', stock: 3, category: 'Home', rating: 4.9, reviewCount: 34 },
      ];
      setProducts(initialProducts);
      localStorage.setItem('ecom_products', JSON.stringify(initialProducts));
    }
  }, []);

  useEffect(() => {
      if (currentUser) {
          // Load user specific data
          const savedWishlist = localStorage.getItem(`ecom_wishlist_${currentUser.username}`);
          if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

          const savedOrders = localStorage.getItem(`ecom_orders_${currentUser.username}`);
          if (savedOrders) setOrders(JSON.parse(savedOrders));
      }
  }, [currentUser]);

  // --- HELPERS ---
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
  };

  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    const usersToStore = updatedUsers.map(({ password, ...user }) => user);
    localStorage.setItem('ecom_users', JSON.stringify(usersToStore));
  };

  const saveProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    localStorage.setItem('ecom_products', JSON.stringify(updatedProducts));
  };

  const saveWishlist = (newWishlist: number[]) => {
      setWishlist(newWishlist);
      if (currentUser) localStorage.setItem(`ecom_wishlist_${currentUser.username}`, JSON.stringify(newWishlist));
  };

  const saveOrders = (newOrders: Order[]) => {
      setOrders(newOrders);
      if (currentUser) localStorage.setItem(`ecom_orders_${currentUser.username}`, JSON.stringify(newOrders));
  }

  // --- HANDLERS ---
  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const username = (e.currentTarget.elements.namedItem('username') as HTMLInputElement).value;
    const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;

    if (username === 'admin' && password === 'timeisgold') {
      setIsLoading(true);
      const adminUser = { id: 0, username: 'admin', role: 'admin' as const };
      setTimeout(() => { 
          setCurrentUser(adminUser);
          setIsLoading(false); 
          setPage('admin-dashboard'); 
      }, 1500);
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem('ecom_users') || '[]').find((u: User) => u.username === username);
    const storedPassword = localStorage.getItem(`ecom_user_${username}_pw`);

    if (storedUser && storedPassword === password) {
      setIsLoading(true);
      setTimeout(() => { 
          setCurrentUser(storedUser);
          setIsLoading(false); 
          setPage('user-home'); 
      }, 1500);
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

    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (users.some(u => u.username === username) || username === 'admin') { setError('Username already exists'); return; }

    setIsLoading(true);
    setTimeout(() => {
        const newUser: User = { id: Date.now(), name, email, username, role: 'user' };
        saveUsers([...users, newUser]);
        localStorage.setItem(`ecom_user_${username}_pw`, password);
        setPage('login');
        showToast('Account created successfully! Please login.');
        setIsLoading(false);
    }, 1500);
  };

  const handleLogout = () => {
    setIsLoading(true);
    setTimeout(() => {
        setCurrentUser(null);
        setPage('login');
        setError('');
        setCart([]);
        setWishlist([]);
        setOrders([]);
        setIsLoading(false);
    }, 800);
  };

  const handleProductSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const name = formData.get('productName') as string;
      const description = formData.get('description') as string;
      const price = parseFloat(formData.get('price') as string);
      const stock = parseInt(formData.get('stock') as string, 10);
      const imageUrl = formData.get('imageUrl') as string;
      const category = formData.get('category') as string || 'General';
      const target = e.currentTarget;

      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Fake network delay

      if (editingProduct) {
          saveProducts(products.map(p => p.id === editingProduct.id ? { ...p, name, description, price, imageUrl, stock, category } : p));
          showToast('Product updated successfully');
      } else {
          const newProduct: Product = { 
            id: Date.now(), 
            name, description, price, imageUrl, stock, 
            category, 
            rating: 0, 
            reviewCount: 0 
          };
          saveProducts([...products, newProduct]);
          showToast('Product added successfully');
      }
      setEditingProduct(null);
      target.reset();
      setIsLoading(false);
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Delete this product?')) {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Fake network delay
        saveProducts(products.filter(p => p.id !== productId));
        showToast('Product deleted');
        setIsLoading(false);
    }
  };

  // --- CART & CHECKOUT ---
  const addToCart = (product: Product, openCart = true) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
            showToast('Cannot add more - stock limit reached', 'error');
            return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`Added ${product.name} to cart`);
    if(openCart) setIsCartOpen(true);
  };

  const toggleWishlist = (productId: number) => {
      if (wishlist.includes(productId)) {
          saveWishlist(wishlist.filter(id => id !== productId));
          showToast('Removed from wishlist');
      } else {
          saveWishlist([...wishlist, productId]);
          showToast('Added to wishlist');
      }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulating payment processing
    
    const updatedProducts = products.map(product => {
      const cartItem = cart.find(item => item.product.id === product.id);
      return cartItem ? { ...product, stock: Math.max(0, product.stock - cartItem.quantity) } : product;
    });
    
    saveProducts(updatedProducts);

    // Create Order Record
    const newOrder: Order = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString(),
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
        status: 'Processing'
    };
    saveOrders([newOrder, ...orders]);

    setCart([]);
    setIsLoading(false);
    setCheckoutStep('success');
  };

  // --- VIEW LOGIC ---
  const uniqueCategories = ['All', ...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesStock = showInStockOnly ? p.stock > 0 : true;
      return matchesSearch && matchesCategory && matchesStock;
  });

  // --- RENDERERS ---
  const renderCartModal = () => {
    if (!isCartOpen) return null;
    const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    return (
      <div className="fixed inset-0 z-[100] flex justify-end">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>
        <div className="relative w-full max-w-md h-full bg-slate-800 shadow-2xl shadow-purple-900/20 flex flex-col border-l border-slate-700 animate-slideInRight">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800">
            <h2 className="text-2xl font-bold text-white pl-6">{checkoutStep === 'cart' ? 'Your Cart' : checkoutStep === 'checkout' ? 'Checkout' : 'Order Status'}</h2>
            <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          </div>

          <div className="flex-grow overflow-y-auto p-6">
            {checkoutStep === 'cart' && (
              <>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-center">
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex gap-4 items-center bg-slate-700/30 p-3 rounded-lg">
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 rounded-md object-cover" />
                        <div className="flex-grow">
                          <h3 className="font-bold text-slate-100 text-sm">{item.product.name}</h3>
                          <p className="text-cyan-400 font-mono text-sm">${item.product.price.toFixed(2)}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button onClick={() => setCart(prev => prev.map(i => i.product.id === item.product.id ? {...i, quantity: Math.max(1, i.quantity - 1)} : i))} className="w-6 h-6 flex items-center justify-center bg-slate-700 rounded hover:bg-slate-600 text-xs">-</button>
                            <span className="text-sm w-4 text-center">{item.quantity}</span>
                            <button onClick={() => addToCart(item.product, false)} className="w-6 h-6 flex items-center justify-center bg-slate-700 rounded hover:bg-slate-600 text-xs">+</button>
                          </div>
                        </div>
                        <button onClick={() => setCart(prev => prev.filter(i => i.product.id !== item.product.id))} className="text-red-400 hover:bg-red-500/10 p-2 rounded-full transition-colors"><TrashIcon /></button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {checkoutStep === 'checkout' && (
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4 animate-fadeIn">
                  <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-700 mb-4">
                      <h3 className="font-bold mb-2 text-slate-300">Order Summary</h3>
                      <div className="flex justify-between text-sm text-slate-400"><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm text-slate-400"><span>Shipping</span><span>Free</span></div>
                      <div className="border-t border-slate-600 my-2 pt-2 flex justify-between font-bold text-white"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
                  </div>
                  <input type="text" required className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-purple-500" placeholder="Full Name" />
                  <textarea required className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-purple-500 h-20 resize-none" placeholder="Shipping Address"></textarea>
                  <input type="text" required className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-purple-500" placeholder="Card Number (Dummy)" />
                  <div className="flex gap-4">
                    <input type="text" required className="flex-1 p-3 bg-slate-700 rounded-md border border-slate-600" placeholder="MM/YY" />
                    <input type="text" required className="flex-1 p-3 bg-slate-700 rounded-md border border-slate-600" placeholder="CVC" />
                  </div>
              </form>
            )}
            {checkoutStep === 'success' && (
              <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
                <p className="text-slate-400 mb-8">Your order has been placed. View it in your profile.</p>
                <button onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); setPage('profile'); }} className="px-8 py-3 bg-slate-700 rounded-md font-bold hover:bg-slate-600">View Orders</button>
              </div>
            )}
          </div>

          {checkoutStep !== 'success' && (
             <div className="p-6 border-t border-slate-700 bg-slate-800">
               {checkoutStep === 'cart' ? (
                 <button onClick={() => setCheckoutStep('checkout')} disabled={cart.length === 0} className="w-full py-3 bg-purple-600 rounded-md font-bold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">Checkout (${cartTotal.toFixed(2)})</button>
               ) : (
                 <div className="flex gap-3">
                   <button onClick={() => setCheckoutStep('cart')} className="flex-1 py-3 bg-slate-700 rounded-md font-bold text-white hover:bg-slate-700">Back</button>
                   <button type="submit" form="checkout-form" disabled={isLoading} className="flex-[2] py-3 bg-cyan-500 rounded-md font-bold text-white hover:bg-cyan-600 flex justify-center items-center">
                     {isLoading ? 'Processing...' : 'Pay Now'}
                   </button>
                 </div>
               )}
             </div>
          )}
        </div>
      </div>
    );
  };

  // --- PAGE RENDERERS ---
  const renderProductDetails = () => {
    if (!activeProduct) return null;
    const isLiked = wishlist.includes(activeProduct.id);
    const reviews = getDummyReviews(activeProduct.id);
    const isOutOfStock = activeProduct.stock === 0;

    const relatedProducts = products
        .filter(p => p.category === activeProduct.category && p.id !== activeProduct.id)
        .slice(0, 4);

    return (
      <div className="w-full max-w-7xl mx-auto animate-fadeIn">
        <button onClick={() => setPage('user-home')} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeftIcon /> Back to Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
           {/* Image Section */}
           <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 p-8 flex items-center justify-center h-[500px] relative group">
              <img src={activeProduct.imageUrl} alt={activeProduct.name} className={`max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-50' : ''}`} />
              {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center"><span className="text-4xl font-black text-white border-4 border-white p-4 rotate-[-15deg] rounded-xl bg-black/50 backdrop-blur-sm">OUT OF STOCK</span></div>}
           </div>

           {/* Info Section */}
           <div className="flex flex-col justify-center">
              <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold mb-2 tracking-wider uppercase">{activeProduct.category}</span>
                    <h1 className="text-4xl font-black text-white leading-tight mb-2">{activeProduct.name}</h1>
                  </div>
                  <button onClick={() => toggleWishlist(activeProduct.id)} className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700">
                      <HeartIcon filled={isLiked} className={isLiked ? "text-pink-500" : "text-slate-400"} />
                  </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                  <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < Math.round(activeProduct.rating)} className="w-5 h-5" />)}
                  </div>
                  <span className="text-slate-400 text-sm">({activeProduct.reviewCount} reviews)</span>
              </div>

              <p className="text-slate-300 text-lg leading-relaxed mb-8">{activeProduct.description}</p>

              <div className="flex items-center gap-6 mb-8 border-t border-slate-700 pt-6">
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">${activeProduct.price.toFixed(2)}</span>
                  <div className="flex flex-col">
                      <span className={`font-bold ${isOutOfStock ? 'text-red-400' : 'text-green-400'}`}>{isOutOfStock ? 'Out of Stock' : 'In Stock'}</span>
                      <span className="text-xs text-slate-500">{activeProduct.stock} units available</span>
                  </div>
              </div>

              <div className="flex gap-4">
                  <button 
                    onClick={() => addToCart(activeProduct)}
                    disabled={isOutOfStock}
                    className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white shadow-lg shadow-purple-900/30 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
                  </button>
              </div>
           </div>
        </div>

        {/* Reviews & Related */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
                <h3 className="text-2xl font-bold mb-6 border-b border-slate-700 pb-2">Customer Reviews</h3>
                <div className="space-y-6">
                    {reviews.map(r => (
                        <div key={r.id} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-xs">{r.user.charAt(0)}</div>
                                    <span className="font-bold">{r.user}</span>
                                </div>
                                <span className="text-xs text-slate-500">{r.date}</span>
                            </div>
                            <div className="flex text-yellow-500 mb-2 w-20">
                                {[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < r.rating} className="w-3 h-3" />)}
                            </div>
                            <p className="text-slate-300 text-sm">{r.comment}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-2xl font-bold mb-6 border-b border-slate-700 pb-2">Related Products</h3>
                <div className="space-y-4">
                    {relatedProducts.map(p => (
                        <div key={p.id} onClick={() => setActiveProduct(p)} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors group">
                            <img src={p.imageUrl} className="w-16 h-16 rounded-lg object-cover bg-slate-700" alt={p.name} />
                            <div>
                                <h4 className="font-bold group-hover:text-cyan-400 transition-colors">{p.name}</h4>
                                <span className="text-sm text-slate-400">${p.price.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 border-b border-slate-700 pb-4">My Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-2xl font-bold">
                        {currentUser?.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{currentUser?.name || currentUser?.username}</h2>
                        <p className="text-slate-400 text-sm">{currentUser?.email}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="w-full py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">Logout</button>
            </div>

            <div className="md:col-span-2">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Order History
                </h2>
                {orders.length === 0 ? (
                    <div className="text-center p-10 border border-dashed border-slate-700 rounded-xl text-slate-500">No orders yet.</div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.id} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                                <div className="bg-slate-800 p-4 flex justify-between items-center text-sm">
                                    <div>
                                        <span className="font-bold text-slate-300 block">{order.id}</span>
                                        <span className="text-slate-500">{order.date}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-cyan-400">${order.total.toFixed(2)}</span>
                                        <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">{order.status}</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 mb-2 last:mb-0">
                                            <div className="w-8 h-8 rounded bg-slate-700 overflow-hidden"><img src={item.product.imageUrl} className="w-full h-full object-cover"/></div>
                                            <span className="text-sm text-slate-300 flex-grow">{item.product.name}</span>
                                            <span className="text-sm text-slate-500">x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );

  const renderWishlist = () => {
      const wishlistProducts = products.filter(p => wishlist.includes(p.id));
      return (
        <div className="w-full max-w-7xl mx-auto">
             <h1 className="text-3xl font-bold mb-8 text-center">My Wishlist</h1>
             {wishlistProducts.length === 0 ? (
                 <div className="text-center py-20 text-slate-500">
                     <HeartIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                     <p className="text-xl">Your wishlist is empty.</p>
                     <button onClick={() => setPage('user-home')} className="mt-4 text-purple-400 hover:underline">Browse Products</button>
                 </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {wishlistProducts.map(product => (
                        <div key={product.id} className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 relative">
                            <button onClick={() => toggleWishlist(product.id)} className="absolute top-3 right-3 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-full text-pink-500 hover:bg-black/70"><HeartIcon filled className="w-5 h-5" /></button>
                            <div className="h-48 overflow-hidden"><img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /></div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg mb-1 truncate">{product.name}</h3>
                                <p className="text-cyan-400 font-bold mb-4">${product.price.toFixed(2)}</p>
                                <button onClick={() => addToCart(product)} className="w-full py-2 bg-purple-600 rounded-lg font-bold text-sm hover:bg-purple-700">Add to Cart</button>
                            </div>
                        </div>
                    ))}
                </div>
             )}
        </div>
      );
  }

  // --- MAIN ROUTER ---
  const renderContent = () => {
    if (!currentUser) {
        // Auth Pages
        if (page === 'signup') {
            return (
                <div className="w-full max-w-md mx-auto animate-fadeIn">
                    <h1 className="text-3xl font-bold text-center mb-8">Join ShopDo</h1>
                    <form onSubmit={handleSignup} className="bg-slate-800 p-8 rounded-2xl shadow-xl shadow-purple-900/10 border border-slate-700">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input name="name" type="text" placeholder="Full Name" required className="p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-purple-500 outline-none transition-colors" />
                                <input name="username" type="text" placeholder="Username" required className="p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-purple-500 outline-none transition-colors" />
                            </div>
                            <input name="email" type="email" placeholder="Email Address" required className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-purple-500 outline-none transition-colors" />
                            <input name="password" type="password" placeholder="Password" required className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-purple-500 outline-none transition-colors" />
                            <input name="confirmPassword" type="password" placeholder="Confirm Password" required className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-purple-500 outline-none transition-colors" />
                        </div>
                        {error && <p className="text-red-400 mt-4 text-sm text-center bg-red-900/20 p-2 rounded">{error}</p>}
                        <button type="submit" className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-bold hover:opacity-90 transition-all shadow-lg">Create Account</button>
                        <p className="text-center text-sm text-slate-400 mt-6">Already have an account? <button onClick={() => setPage('login')} className="text-cyan-400 hover:underline font-medium">Login</button></p>
                    </form>
                </div>
            )
        }
        return (
            <div className="w-full max-w-sm mx-auto animate-fadeIn">
                <h1 className="text-3xl font-bold text-center mb-8">Welcome Back</h1>
                <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-2xl shadow-xl shadow-cyan-900/10 border border-slate-700">
                    <div className="space-y-4">
                        <input name="username" type="text" placeholder="Username" required className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-cyan-500 outline-none transition-colors" />
                        <input name="password" type="password" placeholder="Password" required className="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:border-cyan-500 outline-none transition-colors" />
                    </div>
                    {error && <p className="text-red-400 mt-4 text-sm text-center bg-red-900/20 p-2 rounded">{error}</p>}
                    <button type="submit" className="w-full mt-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-bold hover:opacity-90 transition-all shadow-lg">Login</button>
                    <p className="text-center text-sm text-slate-400 mt-6">New to ShopDo? <button onClick={() => setPage('signup')} className="text-purple-400 hover:underline font-medium">Create Account</button></p>
                </form>
            </div>
        );
    }

    if (currentUser.role === 'admin') {
        // Admin Dashboard (Simplified for brevity, focusing on product mgmt)
        return (
            <div className="w-full max-w-6xl mx-auto animate-fadeIn">
                <h1 className="text-3xl font-bold mb-6">Product Management</h1>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8">
                    <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input name="productName" type="text" placeholder="Product Name" required defaultValue={editingProduct?.name} className="p-3 bg-slate-700 rounded-lg border border-slate-600" />
                        <input name="category" type="text" placeholder="Category" required defaultValue={editingProduct?.category} className="p-3 bg-slate-700 rounded-lg border border-slate-600" />
                        <input name="price" type="number" step="0.01" placeholder="Price" required defaultValue={editingProduct?.price} className="p-3 bg-slate-700 rounded-lg border border-slate-600" />
                        <input name="stock" type="number" placeholder="Stock" required defaultValue={editingProduct?.stock} className="p-3 bg-slate-700 rounded-lg border border-slate-600" />
                        <input name="imageUrl" type="text" placeholder="Image URL" defaultValue={editingProduct?.imageUrl} className="md:col-span-2 p-3 bg-slate-700 rounded-lg border border-slate-600" />
                        <textarea name="description" placeholder="Description" required defaultValue={editingProduct?.description} className="md:col-span-3 p-3 bg-slate-700 rounded-lg border border-slate-600 h-24 resize-none"></textarea>
                        <button type="submit" className="md:col-span-3 py-2 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 transition-colors">{editingProduct ? 'Update' : 'Add'} Product</button>
                    </form>
                </div>
                <div className="grid gap-4">
                    {products.map(p => (
                        <div key={p.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img src={p.imageUrl} className="w-12 h-12 rounded object-cover" alt={p.name}/>
                                <div>
                                    <h3 className="font-bold">{p.name}</h3>
                                    <span className="text-xs text-slate-400">{p.category} • Stock: {p.stock}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingProduct(p)} className="p-2 bg-cyan-500/10 text-cyan-400 rounded hover:bg-cyan-500/20"><PencilIcon /></button>
                                <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"><TrashIcon /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- USER ROUTES ---
    if (page === 'product-details') return renderProductDetails();
    if (page === 'profile') return renderProfile();
    if (page === 'wishlist') return renderWishlist();

    // Default: User Home
    return (
        <div className="w-full max-w-7xl mx-auto animate-fadeIn">
            {/* Hero Section */}
            <div className="rounded-3xl bg-gradient-to-r from-purple-900 to-indigo-900 p-10 mb-10 relative overflow-hidden shadow-2xl">
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">Future Tech <br/><span className="text-cyan-400">Available Today.</span></h1>
                    <p className="text-lg text-indigo-200 mb-6">Discover the latest in quantum computing, holographic interfaces, and zero-gravity comfort.</p>
                    <button onClick={() => { const el = document.getElementById('products-grid'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="px-8 py-3 bg-white text-indigo-900 font-bold rounded-full hover:bg-indigo-50 transition-colors">Shop Now</button>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://placehold.co/800x600/2e1065/4c1d95?text=')] opacity-20 blur-3xl"></div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 sticky top-20 z-40 bg-slate-900/90 backdrop-blur p-4 rounded-xl border border-slate-800">
                <div className="relative w-full md:w-96">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-full focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>
                
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                    {uniqueCategories.map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                
                 <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-300 select-none">
                    <input type="checkbox" checked={showInStockOnly} onChange={e => setShowInStockOnly(e.target.checked)} className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-purple-600 focus:ring-0" />
                    In Stock Only
                </label>
            </div>

            {/* Product Grid */}
            <div id="products-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-slate-500">No products found matching your criteria.</div>
                ) : (
                    filteredProducts.map(product => {
                        const isLiked = wishlist.includes(product.id);
                        const isOutOfStock = product.stock === 0;
                        return (
                            <div key={product.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 group hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col">
                                <div className="relative h-56 overflow-hidden">
                                    <img src={product.imageUrl} alt={product.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isOutOfStock ? 'grayscale' : ''}`} />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                                        className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
                                    >
                                        <HeartIcon filled={isLiked} className={`w-5 h-5 ${isLiked ? 'text-pink-500' : 'text-white'}`} />
                                    </button>
                                    {isOutOfStock && <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-bold tracking-widest">OUT OF STOCK</div>}
                                </div>
                                
                                <div className="p-5 flex flex-col flex-grow cursor-pointer" onClick={() => { setActiveProduct(product); setPage('product-details'); }}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-purple-400 transition-colors">{product.name}</h3>
                                            <span className="text-xs text-slate-500">{product.category}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 mb-3">
                                        <div className="flex text-yellow-500">
                                           <StarIcon filled className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-300">{product.rating.toFixed(1)}</span>
                                        <span className="text-xs text-slate-500">({product.reviewCount})</span>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-700/50">
                                        <span className="text-xl font-black text-cyan-400">${product.price.toFixed(2)}</span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                            disabled={isOutOfStock}
                                            className="p-2 bg-slate-700 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-slate-700"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        onNavigate={(page) => { setPage(page); window.scrollTo(0,0); }} 
        cartItemCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        wishlistCount={wishlist.length}
      />
      <main className="flex-grow container mx-auto px-4 py-8 relative">
        {renderContent()}
      </main>
      {renderCartModal()}
      {isLoading && <GlobalLoader />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Footer />
    </div>
  );
};

export default App;
