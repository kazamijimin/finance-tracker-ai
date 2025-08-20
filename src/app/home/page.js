'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Anchor, Menu, X, PlusCircle, TrendingUp, DollarSign, PieChart, Calendar, Tag, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [balanceSummary, setBalanceSummary] = useState({
    total: 0,
    income: 0,
    expenses: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  
  // Modal state
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    title: '',
    amount: '',
    category: 'Other',
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    note: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionError, setTransactionError] = useState('');

  // Categories with icons
  const categories = [
    { name: 'Food', icon: '🍔' },
    { name: 'Shopping', icon: '🛒' },
    { name: 'Transport', icon: '🚗' },
    { name: 'Entertainment', icon: '🎬' },
    { name: 'Bills', icon: '📄' },
    { name: 'Health', icon: '💊' },
    { name: 'Income', icon: '💰' },
    { name: 'Other', icon: '📌' }
  ];

  // Get category icon
  const getCategoryIcon = (categoryName) => {
    const category = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    return category ? category.icon : '📌';
  };

  // Modify the fetchTransactions function to improve sorting
  const fetchTransactions = async (userId) => {
    try {
      // Temporary solution until index builds
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef, 
        where("userId", "==", userId)
        // Temporarily remove orderBy until index is ready
        // orderBy("date", "desc"),
        // limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      
      const transactions = [];
      let totalIncome = 0;
      let totalExpenses = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const amount = parseFloat(data.amount);
        
        // Add to appropriate total
        if (data.type === 'income') {
          totalIncome += amount;
        } else {
          totalExpenses += amount;
        }
        
        transactions.push({
          id: doc.id,
          ...data,
          amount: amount,
          icon: getCategoryIcon(data.category)
        });
      });
      
      // Improved sort - handle different date formats properly
      transactions.sort((a, b) => {
        // Convert both to comparable dates
        const dateA = a.date instanceof Date 
          ? a.date 
          : a.date && typeof a.date.toDate === 'function'
            ? a.date.toDate()
            : new Date(a.date || 0);
        
        const dateB = b.date instanceof Date 
          ? b.date 
          : b.date && typeof b.date.toDate === 'function'
            ? b.date.toDate()
            : new Date(b.date || 0);
        
        // Sort newest first
        return dateB - dateA;
      });
      
      // Limit manually
      const limitedTransactions = transactions.slice(0, 5);
      
      setRecentTransactions(limitedTransactions);
      setBalanceSummary({
        income: totalIncome,
        expenses: totalExpenses,
        total: totalIncome - totalExpenses
      });
      
      return { transactions: limitedTransactions, totalIncome, totalExpenses };
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return { transactions: [], totalIncome: 0, totalExpenses: 0 };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Get user profile data
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.fullName.split(' ')[0] || 'Captain');
          }
          
          // Fetch actual transactions from Firebase
          await fetchTransactions(currentUser.uid);
          
        } catch (error) {
          console.error("Error fetching user data:", error);
          
          // Use demo data if fetching fails
          setBalanceSummary({
            total: 5280.42,
            income: 6500.00,
            expenses: 1219.58
          });
          
          setRecentTransactions([
            { id: 1, title: 'Coffee Shop', amount: -4.50, category: 'Food', date: new Date(), icon: '☕' },
            { id: 2, title: 'Salary Deposit', amount: 2500.00, category: 'Income', date: new Date(Date.now() - 86400000), icon: '💰' },
            { id: 3, title: 'Grocery Store', amount: -68.24, category: 'Shopping', date: new Date(Date.now() - 86400000 * 2), icon: '🛒' },
            { id: 4, title: 'Gas Station', amount: -42.50, category: 'Transport', date: new Date(Date.now() - 86400000 * 3), icon: '⛽' },
          ]);
        }
      } else {
        // Redirect to login if not authenticated
        router.push('/auth/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  const handleTransactionChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setTransactionError('Image size should be less than 5MB');
        return;
      }
      
      setNewTransaction(prev => ({ ...prev, image: file }));
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setNewTransaction(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Update the upload image function name for clarity
  const uploadImageTransaction = async (file, userId) => {
    if (!file) return null;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simpler file name without folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const bucketName = 'imagetransaction';
      
      console.log("Starting upload to Supabase:", {
        bucketName,
        fileName,
        fileType: file.type
      });
      
      // Simpler upload with minimum options
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);
        
      if (error) {
        console.error("Upload failed:", error);
        throw error;
      }
      
      console.log("Upload successful:", data);
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
    
      console.log("Public URL:", urlData);
      
      setIsUploading(false);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error in upload:", error);
      setIsUploading(false);
      return null;
    }
  };
  
  // Update the handleAddTransaction function to use the renamed function
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setTransactionError('');
    
    // Basic validation
    if (!newTransaction.title || !newTransaction.amount || isNaN(parseFloat(newTransaction.amount))) {
      setTransactionError('Please fill in all required fields with valid values.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // TEMPORARY SOLUTION: Use a placeholder image instead of actual upload
      let imageUrl = '';
      if (newTransaction.image) {
        // Uncomment this line to use the actual upload
        imageUrl = await uploadImageTransaction(newTransaction.image, user.uid);
        
        // Comment out or remove the placeholder
        // imageUrl = "https://placehold.co/400x300/orange/white?text=Receipt";
        
        if (!imageUrl && newTransaction.image) {
          setTransactionError('Failed to upload receipt image. Transaction was not saved.');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Prepare transaction data
      const transactionData = {
        userId: user.uid,
        title: newTransaction.title,
        amount: parseFloat(newTransaction.amount),
        type: newTransaction.type,
        category: newTransaction.category,
        date: new Date(newTransaction.date),
        note: newTransaction.note || '',
        imageUrl: imageUrl || '',
        createdAt: serverTimestamp()
      };
      
      // Add to Firestore
      await addDoc(collection(db, 'transactions'), transactionData);
      
      // Reset form and close modal
      setNewTransaction({
        title: '',
        amount: '',
        category: 'Other',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        note: '',
        image: null
      });
      setImagePreview(null);
      
      // Refresh transactions list
      await fetchTransactions(user.uid);
      
      // Close modal
      setIsAddTransactionModalOpen(false);
    } catch (error) {
      console.error("Error adding transaction:", error);
      setTransactionError('Failed to add transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date function - improved to handle Firestore timestamps
  const formatDate = (date) => {
    if (!date) return '';
    
    let transactionDate;
    
    // Handle different date formats
    if (date && typeof date === 'object' && date.toDate) {
      // Handle Firestore Timestamp
      transactionDate = date.toDate();
    } else if (date instanceof Date) {
      // Handle JavaScript Date
      transactionDate = date;
    } else if (typeof date === 'string') {
      // Handle date string
      transactionDate = new Date(date);
    } else {
      // Handle number (timestamp) or other formats
      try {
        transactionDate = new Date(date);
      } catch (e) {
        console.error("Invalid date format:", date);
        return 'Unknown date';
      }
    }
    
    // Check if we got a valid date
    if (isNaN(transactionDate.getTime())) {
      console.error("Invalid date value:", date);
      return 'Unknown date';
    }
    
    const now = new Date();
    
    // Check if today
    if (transactionDate.toDateString() === now.toDateString()) {
      return 'Today';
    }
    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (transactionDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise return formatted date
    return transactionDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-yellow-50 via-orange-50 to-red-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-700 font-medium">Gathering your treasure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-orange-50 to-red-50">
      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMenuOpen(false)}></div>
      )}

      {/* Transaction Modal Overlay - Updated with image upload */}
      {isAddTransactionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Add Transaction</h3>
              <button 
                onClick={() => setIsAddTransactionModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {transactionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {transactionError}
              </div>
            )}
            
            <form onSubmit={handleAddTransaction} className="space-y-5">
              {/* Transaction Type */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className={`flex items-center justify-center border rounded-lg p-3 cursor-pointer transition-colors ${newTransaction.type === 'expense' ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    onClick={() => setNewTransaction(prev => ({ ...prev, type: 'expense' }))}
                  >
                    <span>Expense</span>
                  </div>
                  <div 
                    className={`flex items-center justify-center border rounded-lg p-3 cursor-pointer transition-colors ${newTransaction.type === 'income' ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    onClick={() => setNewTransaction(prev => ({ ...prev, type: 'income' }))}
                  >
                    <span>Income</span>
                  </div>
                </div>
              </div>
              
              {/* Title */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={newTransaction.title}
                  onChange={handleTransactionChange}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Transaction name"
                  required
                />
              </div>
              
              {/* Amount */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={handleTransactionChange}
                    className="w-full p-3 pl-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={newTransaction.category}
                    onChange={handleTransactionChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {categories.map(category => (
                      <option key={category.name} value={category.name}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={newTransaction.date}
                    onChange={handleTransactionChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              {/* Note */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Note (Optional)
                </label>
                <textarea
                  name="note"
                  value={newTransaction.note}
                  onChange={handleTransactionChange}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Add a note..."
                  rows="2"
                ></textarea>
              </div>
              
              {/* Receipt Image Upload */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  ImageTransaction Receipt (Optional)
                </label>
                
                {imagePreview ? (
                  <div className="relative mt-2 rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={imagePreview} 
                      alt="Transaction receipt" 
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                      title="Remove image"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col items-center">
                      <Upload className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-700">
                        Click to upload ImageTransaction receipt
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG (Max 5MB)
                      </p>
                    </div>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/png, image/jpeg, image/jpg"
                      className="hidden"
                    />
                  </div>
                )}
                
                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-orange-500 h-2.5 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 text-right mt-1">
                      {uploadProgress}% uploaded
                    </p>
                  </div>
                )}
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-medium py-3 px-6 rounded-xl shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Transaction'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar - desktop visible, mobile hidden behind overlay */}
      <div className={`fixed top-0 left-0 h-full bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out w-64 lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-orange-400 to-yellow-500 rounded-full flex items-center justify-center">
                <Anchor className="w-6 h-6 text-white" />
              </div>
              <h1 className="ml-2 text-xl font-bold text-gray-800">Treasure Tracker</h1>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="lg:hidden">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          
          <div className="space-y-2 mt-8">
            <button className="w-full flex items-center px-4 py-3 text-left rounded-xl bg-orange-100 text-orange-700 font-medium">
              <TrendingUp className="w-5 h-5 mr-3" />
              Dashboard
            </button>
            <button className="w-full flex items-center px-4 py-3 text-left rounded-xl text-gray-700 hover:bg-gray-100">
              <DollarSign className="w-5 h-5 mr-3" />
              Transactions
            </button>
            <button className="w-full flex items-center px-4 py-3 text-left rounded-xl text-gray-700 hover:bg-gray-100">
              <PieChart className="w-5 h-5 mr-3" />
              Analytics
            </button>
            <button className="w-full flex items-center px-4 py-3 text-left rounded-xl text-gray-700 hover:bg-gray-100">
              <Calendar className="w-5 h-5 mr-3" />
              Budgets
            </button>
            <button className="w-full flex items-center px-4 py-3 text-left rounded-xl text-gray-700 hover:bg-gray-100">
              <Tag className="w-5 h-5 mr-3" />
              Categories
            </button>
          </div>
        </div>
        
        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
              {userName ? userName[0].toUpperCase() : 'U'}
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-800">{userName || 'User'}</p>
              <button 
                onClick={handleSignOut}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top navigation */}
        <nav className="bg-white shadow-sm">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="ml-2 text-xl font-bold text-gray-800 lg:hidden">Treasure Tracker</h1>
            </div>
            <div className="lg:hidden">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                {userName ? userName[0].toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </nav>

        {/* Dashboard content */}
        <div className="p-4 lg:p-8">
          {/* Welcome section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Ahoy, {userName}! 🏴‍☠️
            </h1>
            <p className="text-gray-600">
              Welcome to your treasure map. Here's your financial adventure for today.
            </p>
          </div>

          {/* Balance summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-500 text-sm">Total Balance</h3>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">+12% ↑</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">${balanceSummary.total.toFixed(2)}</h2>
              <div className="mt-2 flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(((balanceSummary.income) / (balanceSummary.income + balanceSummary.expenses || 1)) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-500 text-sm">Income</h3>
              </div>
              <h2 className="text-2xl font-bold text-green-600">${balanceSummary.income.toFixed(2)}</h2>
              <p className="text-gray-500 text-sm mt-2">Current month</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-500 text-sm">Expenses</h3>
              </div>
              <h2 className="text-2xl font-bold text-red-600">${balanceSummary.expenses.toFixed(2)}</h2>
              <p className="text-gray-500 text-sm mt-2">Current month</p>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="bg-white p-6 rounded-2xl shadow-md mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Recent Transactions</h3>
              <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                View All
              </button>
            </div>
            
            {recentTransactions.length > 0 ? (
              <div className="space-y-6">
                {/* Group transactions by date */}
                {(() => {
                  const groupedTransactions = {};
                  
                  // Group transactions by date string
                  recentTransactions.forEach(transaction => {
                    const dateStr = formatDate(transaction.date);
                    if (!groupedTransactions[dateStr]) {
                      groupedTransactions[dateStr] = [];
                    }
                    groupedTransactions[dateStr].push(transaction);
                  });
                  
                  // Convert to array for rendering
                  return Object.entries(groupedTransactions).map(([dateStr, transactions]) => (
                    <div key={dateStr} className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">{dateStr}</h4>
                      <div className="space-y-3">
                        {transactions.map(transaction => (
                          <div key={transaction.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center">
                              {transaction.imageUrl ? (
                                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                                  <img 
                                    src={transaction.imageUrl} 
                                    alt={transaction.title} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = "https://placehold.co/40x40/gray/white?text=No+Image";
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                                  {transaction.icon}
                                </div>
                              )}
                              <div className="ml-4">
                                <h4 className="font-medium text-gray-800">{transaction.title}</h4>
                                <p className="text-xs text-gray-500">{transaction.category}</p>
                              </div>
                            </div>
                            <span className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No transactions yet. Add your first one!</p>
              </div>
            )}
          </div>

          {/* Add transaction button - floating at bottom on mobile */}
          <div className="fixed bottom-6 right-6 lg:static lg:mt-4 lg:flex lg:justify-end">
            <button 
              onClick={() => setIsAddTransactionModalOpen(true)}
              className="flex items-center justify-center bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 w-14 h-14 lg:w-auto lg:h-auto lg:px-6 lg:py-3 rounded-full lg:rounded-xl text-white shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <PlusCircle className="w-6 h-6 lg:mr-2" />
              <span className="hidden lg:block font-medium">Add Transaction</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}