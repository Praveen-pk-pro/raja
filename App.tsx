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
      const timer = setTimeout(() => {
        setIsLoading(false);
        setPage(currentUser.role === 'admin' ? 'admin-dashboard' : 'user-home');
      }, 3000); // 3 seconds

      return () => clearTimeout(timer); // Cleanup timer on component unmount
    }
  }, [isLoading, currentUser]);


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


  // --- RENDER LOGIC ---
  const renderPage = () => {
    if (isLoading) {
      // --- LOADING SCREEN ---
      return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 sm:p-12 text-center shadow-2xl shadow-purple-500/10 flex flex-col items-center">
                {/* Spinner */}
                <svg className="animate-spin h-16 w-16 text-purple-400 mb-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>

                {/* Title */}
                <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-6 animate-pulse">
                    Launching ShopDo
                </h1>

                {/* Credits */}
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
      return (
        <div className="w-full max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Products</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products.map(product => {
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
                        <button disabled={isOutOfStock} className="px-4 py-2 bg-purple-600 rounded-md font-bold text-sm hover:bg-purple-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400">
                          {isOutOfStock ? 'Unavailable' : 'View / Buy'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={setPage} />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex flex-col justify-center items-center">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

export default App;