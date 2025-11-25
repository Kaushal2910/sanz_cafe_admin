import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage,db } from "./firebase";
//import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import SpecialRequests from "./SpecialRequests";





import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    query, 
    onSnapshot, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp,
    setDoc,
    getDocs
} from 'firebase/firestore';
import { 
    Menu, X, Plus, Trash2, Edit2, Zap, LayoutDashboard, Utensils, 
    Loader2, CheckCircle, Ban, Image, TrendingUp 
} from 'lucide-react';
import AdminModal from "./AdminModal.jsx";
// --- GLOBAL VARIABLES (from .env via src/firebase.js) ---
import { firebaseConfig as _firebaseConfig, db as _db, auth as _auth } from './firebase';
const firebaseConfig = _firebaseConfig || {};
// No canvas global variables in real React environment.
const initialAuthToken = null; 
const appId = 'sanz-cafe';   // you can change the name anytime


//smae name ye but it willl almost word to send data to storeage
async function seedInitialMenuDataOnce() {
  try {
    const colRef = collection(db, 'menu_items');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      console.log('menu_items already populated — skipping seed');
      return;
    }

    console.log('Seeding initial menu items...');
    for (const item of initialMenuItems) {
      const docRef = await addDoc(colRef, {
        name: item.name || '',
        desc: item.desc || '',
        price: item.price || 0,
        category: item.category || 'General',
        isAvailable: typeof item.isAvailable === 'boolean' ? item.isAvailable : true,
        createdAt: serverTimestamp()
      });
      await updateDoc(docRef, {id: docRef.id,imageUrl: `/Food/${item.imageUrl}`, });
      //await updateDoc(docRef, {id: docRef.id,imageUrl: `/Food/${docRef.id}.jpg`, });

    }
    console.log('Seeding completed.');
  } catch (err) {
    console.error('Error seeding menu items:', err);
  }
}


// --- FIREBASE INITIALIZATION ---
let app;

/* let db;
let auth; */

// --- CONSTANTS AND UTILITIES ---
//const formatCurrency = (amount) => `$${Number(amount).toFixed(2)}`;
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}
const MENU_CATEGORIES = ['pizza', 'fries', 'garlic-breads', 'sandwiches', 'burgers', 'pasta', 'soup-salad', 'combos'];

// Initial Menu Data from user's menu.js (flattened for easy seeding)

//seeding sathi all cafe items

const initialMenuItems = [
  // 🍕 Pizza
  { id: "p1", name: "Margherita", desc: "Classic cheese & tomato", price: 249, category: "pizza", imageUrl: "p1.jpg", isAvailable: true },
  { id: "p2", name: "corn cheese pizza", desc: "Loaded with corn and cheese", price: 280, category: "pizza", imageUrl: "p2.jpg", isAvailable: true },
  { id: "p3", name: "Tandoori Panner Pizza", desc: "Smoky Paneer with Tandoor Flavour", price: 330, category: "pizza", imageUrl: "p3.jpg", isAvailable: true },
  { id: "p4", name: "Panner Tikka Pizza", desc: "Tangy and exotic paneer tikka flavoured", price: 320, category: "pizza", imageUrl: "p4.jpg", isAvailable: true },
  { id: "p5", name: "Cheese Loaded Pizza", desc: "Mozzarella Loaded Cheese burst pizza", price: 390, category: "pizza", imageUrl: "p5.jpg", isAvailable: true },
  { id: "p6", name: "Spicy pizza", desc: "Hot sauce & spicy chicken", price: 320, category: "pizza", imageUrl: "p6.jpg", isAvailable: true },

  // 🍟 Fries
  { id: "f1", name: "Classic Fries", desc: "Golden crispy potato fries", price: 120, category: "fries", imageUrl: "f1.jpg", isAvailable: true },
  { id: "f2", name: "Cheese Fries", desc: "Topped with melted cheese", price: 140, category: "fries", imageUrl: "f2.jpg", isAvailable: true },
  { id: "f3", name: "Chilli Cheese", desc: "Spicy chilli + cheese", price: 160, category: "fries", imageUrl: "f3.jpg", isAvailable: true },
  { id: "f4", name: "Peri-Peri", desc: "Seasoned with peri spices", price: 160, category: "fries", imageUrl: "f4.jpg", isAvailable: true },
  { id: "f5", name: "Cheese Chilly Nachos", desc: "Nacho topped with melted Chilly Cheese", price: 210, category: "fries", imageUrl: "f5.jpg", isAvailable: true },
  { id: "f6", name: "Veg Loaded Nachos", desc: "Nachos topped with veggies and flavoured cheese", price: 240, category: "fries", imageUrl: "f6.jpg", isAvailable: true },

  // 🧄 Garlic Breads
  { id: "g1", name: "Plain Garlic Bread", desc: "Buttery & garlicky", price: 110, category: "garlic-breads", imageUrl: "g1.jpg", isAvailable: true },
  { id: "g2", name: "Cheese Garlic Bread", desc: "Cheese Loaded Garlic Bread", price: 130, category: "garlic-breads", imageUrl: "g2.jpg", isAvailable: true },
  { id: "g3", name: "Herb & Cheese", desc: "Italian herbs + cheese", price: 150, category: "garlic-breads", imageUrl: "g3.jpg", isAvailable: true },
  { id: "g4", name: "Spicy Jalapeño", desc: "With jalapeños & chilli flakes", price: 150, category: "garlic-breads", imageUrl: "g4.jpg", isAvailable: true },
  { id: "g5", name: "Olive & Tomato", desc: "Olives & sun-dried tomato", price: 160, category: "garlic-breads", imageUrl: "g5.jpg", isAvailable: true },
  { id: "g6", name: "Pesto Delight", desc: "Pesto sauce topping", price: 230, category: "garlic-breads", imageUrl: "g6.jpg", isAvailable: true },

  // 🥪 Sandwiches
  { id: "s1", name: "Corn Cheese Sandwich", desc: "Filled with Cheese and Sweet Corn", price: 180, category: "sandwiches", imageUrl: "s1.jpg", isAvailable: true },
  { id: "s2", name: "Veg Loaded Sandwich", desc: "Loaded and filled with veggies and melting cheese", price: 190, category: "sandwiches", imageUrl: "s2.jpg", isAvailable: true },
  { id: "s3", name: "Paneer Tikka", desc: "Spicy tikka chunks", price: 220, category: "sandwiches", imageUrl: "s3.jpg", isAvailable: true },
  { id: "s4", name: "Tandoori Paneer", desc: "Smooky Tandoor Flavoured", price: 230, category: "sandwiches", imageUrl: "s4.jpg", isAvailable: true },
  { id: "s5", name: "Club Sandwich", desc: "Triple-decker classic", price: 250, category: "sandwiches", imageUrl: "s5.jpg", isAvailable: true },
  { id: "s6", name: "Bombay Sandwich", desc: "Triple layered Sandwich filled with smashed potatoes and authentic Spices", price: 250, category: "sandwiches", imageUrl: "s6.jpg", isAvailable: true },

  // 🍔 Burgers
  { id: "b2", name: "Zinger Spicy Burger", desc: "Crispy Zinger fillet with spice tone", price: 160, category: "burgers", imageUrl: "b2.jpg", isAvailable: true },
  { id: "b1", name: "Veg Cheese Burger", desc: "Veg patty, Lettuce, Onion, Tomato, Cheese Slice", price: 170, category: "burgers", imageUrl: "b1.jpg", isAvailable: true },
  { id: "b3", name: "Veggie Supreme", desc: "Veg patty & fresh veg with dripping Cheese", price: 230, category: "burgers", imageUrl: "b3.jpg", isAvailable: true },
  { id: "b4", name: "BBQ Bacon", desc: "BBQ sauce & bacon strips", price: 250, category: "burgers", imageUrl: "b4.jpg", isAvailable: true },
  { id: "b5", name: "Double Cheese", desc: "Double patty & cheese", price: 260, category: "burgers", imageUrl: "b5.jpg", isAvailable: true },
  { id: "b6", name: "Spicy Paneer", desc: "Spicy paneer patty", price: 270, category: "burgers", imageUrl: "b6.jpg", isAvailable: true },

  // 🍝 Pasta
  { id: "pa1", name: "Aglio Olivo Pasta", desc: "Mixed Spiced dry pasta", price: 310, category: "pasta", imageUrl: "pa1.jpg", isAvailable: true },
  { id: "pa2", name: "Tangy Tomato Pasta", desc: "Tangy macccroni", price: 310, category: "pasta", imageUrl: "pa2.jpg", isAvailable: true },
  { id: "pa3", name: "Red Sause Pasta", desc: "Made in Spicy tomato red sauce", price: 340, category: "pasta", imageUrl: "pa3.jpg", isAvailable: true },
  { id: "pa4", name: "Pink Sause Pasta", desc: "Combo of red+White Sause associated with Garlic Bread", price: 350, category: "pasta", imageUrl: "pa4.jpg", isAvailable: true },
  { id: "pa5", name: "Pesto Penne", desc: "Basil pesto & pine nuts", price: 310, category: "pasta", imageUrl: "pa5.jpg", isAvailable: true },
  { id: "pa6", name: "Mac & Cheese", desc: "Classic cheesy mac", price: 330, category: "pasta", imageUrl: "pa6.jpg", isAvailable: true },
  { id: "pa7", name: "White Sause Pasta", desc: "Creamy White Sause Pasta accompanied by Garlic Bread", price: 390, category: "pasta", imageUrl: "pa7.jpg", isAvailable: true },
  
  //Soups and Salad
  { id: "ss1", name: "Tomato Soup", desc: "Rich & creamy tomato", price: 140, category: "soup-salad", imageUrl: "ss1.jpg", isAvailable: true },
  { id: "ss2", name: "Minestrone", desc: "Mixed veggie soup", price: 180, category: "soup-salad", imageUrl: "ss2.jpg", isAvailable: true },
  { id: "ss3", name: "Caesar Salad", desc: "Romaine, croutons, parmesan", price: 280, category: "soup-salad", imageUrl: "ss3.jpg", isAvailable: true },
  { id: "ss4", name: "Greek Salad", desc: "Olives, feta, cucumbers", price: 290, category: "soup-salad", imageUrl: "ss4.jpg", isAvailable: true },
  { id: "ss5", name: "Chicken Soup", desc: "Shredded chicken broth", price: 260, category: "soup-salad", imageUrl: "ss5.jpg", isAvailable: true },
  { id: "ss6", name: "Quinoa Salad", desc: "Quinoa, veggies, lemon", price: 320, category: "soup-salad", imageUrl: "ss6.jpg", isAvailable: true },

  //combos
  { id: "c1", name: "Combo 1", desc: "Veg Cheese Burger + fries", price: 300, category: "combos", imageUrl: "c1.jpg", isAvailable: true },
  { id: "c2", name: "Combo 2", desc: "Veg Cheese Burger + fries + Milkshake", price: 360, category: "combos", imageUrl: "c2.jpg", isAvailable: true },
  { id: "c3", name: "Combo 3", desc: "Burger + Fries + Nuggets", price: 420, category: "combos", imageUrl: "c3.jpg", isAvailable: true },
  { id: "c4", name: "Salad + Soup", desc: "Any salad + any soup", price: 450, category: "combos", imageUrl: "c4.jpg", isAvailable: true },
  { id: "c5", name: "Sandwich + Fries", desc: "Any sandwich + fries", price: 310, category: "combos", imageUrl: "c5.jpg", isAvailable: true },
  { id: "c6", name: "Family Combo", desc: "2 pizzas, 1 fries, 2 drinks", price: 410, category: "combos", imageUrl: "c6.jpg", isAvailable: true },
];

// orders datastructure seeding

async function testCreateOrder() {
  const order = {
    userId: "testUser123",
    items: [
      { id: "p1", name: "Margherita", qty: 2, price: 249 }
    ],
    totalAmount: 498,
    paymentStatus: "success",
    orderStatus: "pending",
    createdAt: serverTimestamp()
  };

  await addDoc(collection(db, "orders"), order);
  alert("Order created!");
}


// Helper for initial mock orders data (PRIVATE)
function getRandomItems(menuItems) {
  const count = Math.floor(Math.random() * 3) + 1;
  let items = [];

  for (let i = 0; i < count; i++) {
    const random = menuItems[Math.floor(Math.random() * menuItems.length)];
    items.push({
      id: random.id || "item",
      name: random.name,
      qty: Math.floor(Math.random() * 3) + 1,
      price: random.price,
    });
  }

  return items;
}

async function seedFakeOrders() {
  try {
    const menuSnap = await getDocs(collection(db, "menu_items"));
    const menuItems = menuSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (menuItems.length === 0) {
      alert("No menu items found. Seed products first.");
      return;
    }

    const ordersCol = collection(db, "orders");
    const fakeUsers = ["u1", "u2", "u3", "u4", "u5"];

    for (let i = 0; i < 25; i++) {
      const items = getRandomItems(menuItems);
      const totalAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);

      const order = {
        userId: fakeUsers[Math.floor(Math.random() * fakeUsers.length)],
        items,
        totalAmount,
        paymentStatus: "success",
        orderStatus: "delivered",
        createdAt: serverTimestamp(),
      };

      await addDoc(ordersCol, order);
      console.log("Added fake order", i + 1);
    }

    alert("Fake orders added (25 orders)");
  } catch (err) {
    console.error("Error seeding orders:", err);
  }
}

// Seeding function for the Menu (PUBLIC)
const seedInitialMenuData = async () => {
    if (!db) return; // Prevent crash if DB isn't initialized

    const menuCollectionPath = `menu_items`;
    const menuCollectionRef = collection(db, menuCollectionPath);
    
    try {
        // Check if collection is empty
        const snapshot = await getDocs(menuCollectionRef);
        if (!snapshot.empty) {
            console.log("Menu collection already populated. Skipping seed.");
            return;
        }

        console.log("Seeding initial menu data...");
        for (const item of initialMenuItems) {
            // Use addDoc to generate a unique ID
            await addDoc(menuCollectionRef, { ...item, lastUpdated: serverTimestamp() });
        }
        console.log("Initial menu data seeded successfully.");
    } catch (error) {
        console.error("Failed to seed initial menu data:", error);
    }
};

//image upload cha issue solve karayla adminmodal and app.jsx madhla handleimageupload()
// --- APP COMPONENT ---
const App = () => {

    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const fileRef = ref(storage, `menu_images/${file.name}`);

        try {
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            setMenuForm(prev => ({
                ...prev,
                imageUrl: url
            }));
            alert("Image uploaded successfully!");
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error uploading image");
        }
    }

    // 1. STATE MANAGEMENT
    const [userId, setUserId] = useState(null);
    const [isFirebaseReady, setIsFirebaseReady] = useState(false); // New flag
    const [isLoading, setIsLoading] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');
    const [menuItems, setMenuItems] = useState([]);
    const [mockOrders, setMockOrders] = useState([]);
    const [menuForm, setMenuForm] = useState({ 
        id: null, name: '', desc: '', price: 0.0, category: 'pizza', 
        imageUrl: '', isOutOfStock: false 
    });
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [powerBiUrl] = useState("https://app.powerbi.com/view?r=eyJrIjoiNjA5Zjc3NzEtNThlZi00Mjk0LWE1YmMtYzc2NmU2MWYwZmRkIiwidCI6IjQzNDY2ZTMwLTQ1ODktNDgzOC1iYzM5LTJlZTRmODczNzgwOSJ9");


    // 2. FIREBASE SETUP AND AUTHENTICATION
    useEffect(() => {
        // 🛑 CRITICAL FIX: Only attempt to initialize Firebase if the config is not an empty object.
        const isConfigValid = Object.keys(firebaseConfig).length > 0;
        
        if (!isConfigValid) {
            console.error("Firebase config is empty. Running in local mock mode.");
            setIsLoading(false);
            return; // Stop execution if no config
        }
        const auth = _auth;
        try {
            setIsFirebaseReady(true);
        }
        catch (e) {
            console.error("Firebase initialization failed:", e);
            setIsLoading(false);
            return;
        }

        const setupAuth = async () => {
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken)
                    .catch(e => {
                        console.error("Custom token sign-in failed:", e);
                        return signInAnonymously(auth);
                    });
            } else {
                await signInAnonymously(auth);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                // Run seeding/mock generation after auth confirms user
                 
                seedInitialMenuDataOnce();
            } else {
                setUserId(null);
            }
            setIsLoading(false);
        });

        setupAuth();
        return () => unsubscribe();
    }, []);

    // 3. FIRESTORE REAL-TIME LISTENERS
    useEffect(() => {
        // Only run if Firebase is fully initialized and we have a userId
        if (!userId || !isFirebaseReady) return; 

        // Path: /artifacts/{appId}/public/data/menu_items
        const menuCollectionPath = `menu_items`;
        const menuQ = query(collection(db, menuCollectionPath));
        
        // Listener for Menu Items (CRUD)
        const unsubscribeMenu = onSnapshot(menuQ, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort to make new items appear first
            items.sort((a, b) => (b.lastUpdated?.toMillis() || 0) - (a.lastUpdated?.toMillis() || 0));
            setMenuItems(items);
        }, (error) => {
            console.error("Error listening to menu data:", error);
            setMessage("Failed to load menu data.");
        });

        // Listener for Mock Orders (Dashboard - PRIVATE DATA)
        const ordersCollectionPath = `orders`;
        const ordersQ = query(collection(db, ordersCollectionPath));

        const unsubscribeOrders = onSnapshot(ordersQ, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({
                orderId: doc.id,
                ...doc.data(),
                itemsCount: doc.data().items?.length || 0,
                date: doc.data().createdAt?.toDate?.() || null,
                total: doc.data().totalAmount || 0,
                status: doc.data().orderStatus || "Unknown",

            }));
            setMockOrders(orders);
        });

        return () => {
            unsubscribeMenu();
            unsubscribeOrders();
        };
    }, [userId, isFirebaseReady]); // Depend on both flags

    // ... (4. CRUD OPERATIONS and 5. HANDLERS AND UI HELPERS remain unchanged)
    const handleSaveMenu = async (e) => {
        e.preventDefault();
        if (!userId || !menuForm.name || !menuForm.price || !isFirebaseReady) {
            setMessage("Cannot save: Firebase connection not ready.");
            return;
        }
        
        const itemData = {
            name: menuForm.name,
            desc: menuForm.desc || '',
            price: Number(menuForm.price),
            category: menuForm.category,
            imageUrl: menuForm.imageUrl || '',
            isOutOfStock: menuForm.isOutOfStock,
            lastUpdated: serverTimestamp()
        };

        const menuCollectionPath = `menu_items`;
        
        try {
            if (menuForm.id) {
                // UPDATE operation
                const docRef = doc(db, menuCollectionPath, menuForm.id);
                await updateDoc(docRef, itemData);
                setMessage(`${menuForm.name} updated successfully!`);
            } else {
                // CREATE operation
                const docRef = await addDoc(collection(db, menuCollectionPath), itemData);
                await updateDoc(docRef, {
                    id: docRef.id,
                    imageUrl: `/Food/${docRef.id}.jpg`,
                     
                });

                setMessage(`${menuForm.name} added successfully!`);
            }
            setIsMenuModalOpen(false);
        } catch (error) {
            console.error("Error saving document: ", error);
            setMessage(`Failed to save item: ${error.message}`);
        }
    };

    const handleDeleteMenu = async (id, name) => {
        if (!isFirebaseReady) {
            setMessage("Cannot delete: Firebase connection not ready.");
            return;
        }
        // Use custom modal or UI element instead of window.confirm
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return; 
        try {
            const docRef = doc(db, `menu_items`, id);
            await deleteDoc(docRef);
            setMessage(`${name} deleted successfully!`);
        } catch (error) {
            console.error("Error deleting document: ", error);
            setMessage(`Failed to delete item: ${error.message}`);
        }
    };
    
    /* const handleToggleStock = async (item) => {
        if (!isFirebaseReady) {
            setMessage("Cannot update stock: Firebase connection not ready.");
            return;
        }
        if (!item.id) {
            setMessage("Cannot update: Missing item ID.");
            return;
        }
        const newStatus = !item.isOutOfStock;
        try {
            const docRef = doc(db, `menu_items`, item.id);
            await updateDoc(docRef, { 
                isOutOfStock: newStatus,
                lastUpdated: serverTimestamp()
            });
        
            setMessage(`${item.name} set to ${newStatus ? 'Out of Stock' : 'In Stock'}!`);
            //setMessage(`${item.name} set to ${item.isOutOfStock ? 'In Stock' : 'Out of Stock'}!`);
        } catch (error) {
            console.error("Error updating stock status: ", error);
            setMessage(`Failed to update stock: ${error.message}`);
        }
    }; */
    const handleToggleStock = async (item) => {
        if (!isFirebaseReady) {
            setMessage("Cannot update stock: Firebase connection not ready.");
            return;
        }
        if (!item.id) {
            setMessage("Cannot update: Missing item ID.");
            return;
        }

        const newStatus = !item.isOutOfStock;

        try {
            const docRef = doc(db, "menu_items", item.id);
            await updateDoc(docRef, {
                isOutOfStock: newStatus,
                lastUpdated: serverTimestamp(),
            });

            setMessage(`${item.name} set to ${newStatus ? "Out of Stock" : "In Stock"}!`);
        } catch (error) {
            console.error("Error updating stock status:", error);
            setMessage(`Failed to update stock: ${error.message}`);
        }
    };

    // 5. HANDLERS AND UI HELPERS
    const handleEdit = (item) => {
        const basePath = `/Food/${item.id}`;
        const extensions = ['jpg', 'jpeg', 'png'];
        const fallbackImageUrl = item.imageUrl || `${basePath}.jpg`;

        setMenuForm({
            id: item.id,
            name: item.name,
            desc: item.desc || '',
            price: item.price,
            category: item.category,
            imageUrl: fallbackImageUrl || '',
            isOutOfStock: item.isOutOfStock || false,
        });
        setIsMenuModalOpen(true);
    };

    const handleNewItem = () => {
        setMenuForm({ id: null, name: '', desc: '', price: 0.0, category: 'pizza', imageUrl: '', isOutOfStock: false });
        setIsMenuModalOpen(true);
    };

    // Derived State for Dashboard Stats (MOCK ANALYTICS)
    const dashboardStats = useMemo(() => {
        const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0);
        //const deliveredOrders = mockOrders.filter(o => o.status === 'Delivered').length;
        const deliveredOrders = mockOrders.filter(o => o.status === 'delivered').length;
        const pendingOrders = mockOrders.filter(o => o.status === 'pending').length;
        //const pendingOrders = mockOrders.filter(o => o.status === 'Pending').length;
        const outOfStock = menuItems.filter(item => item.isOutOfStock).length;

        return [
            { title: "Total Revenue", value: formatCurrency(totalRevenue), icon: Zap, color: 'text-green-400' },
            { title: "Active Menu Items", value: menuItems.length - outOfStock, icon: Utensils, color: 'text-yellow-400' },
            { title: "Delivered Orders", value: deliveredOrders, icon: CheckCircle, color: 'text-blue-400' },
            { title: "Out of Stock", value: outOfStock, icon: Ban, color: 'text-red-400' },
        ];
    }, [mockOrders, menuItems]);


    // Renderers
    const renderMenuManager = () => (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-6 text-yellow-400 border-b border-gray-700 pb-2">Menu Item Manager</h2>
            <button
                onClick={handleNewItem}
                className="mb-6 flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 shadow-md"
            >
                <Plus className="w-5 h-5 mr-2" /> Add New Item
            </button>
            
            <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-xl">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {menuItems.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-400">No menu items found. Start adding some!</td></tr>
                        ) : menuItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-700 transition duration-150">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 capitalize">{item.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-yellow-400">{formatCurrency(item.price)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button 
                                        onClick={() => handleToggleStock(item)}
                                        className={`px-3 py-1 text-xs leading-5 font-semibold rounded-full transition-colors ${
                                            item.isOutOfStock 
                                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                    >
                                        {item.isOutOfStock ? 'Out of Stock' : 'In Stock'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="text-indigo-400 hover:text-indigo-300 mr-3 p-1 rounded-full hover:bg-gray-600 transition"
                                        title="Edit Item"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMenu(item.id, item.name)}
                                        className="text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-gray-600 transition"
                                        title="Delete Item"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderDashboard = () => (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-8 text-yellow-400 border-b border-gray-700 pb-2">Admin Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {dashboardStats.map((stat, index) => (
                    <div key={index} className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 transition duration-300 hover:scale-[1.02]">
                        <div className="flex items-center justify-between">
                            <stat.icon className={`w-8 h-8 ${stat.color}`} />
                            <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                        </div>
                        <p className="mt-4 text-4xl font-extrabold text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Power BI Integration Showcase */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
                <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2 text-yellow-400"/> Live Sales Analytics (Power BI)
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                    This embedded view demonstrates the integration of operational data (from Firestore) with a Business Intelligence tool like Power BI for visual insights into sales and inventory.
                </p>
                <div className="w-full aspect-video border-2 border-yellow-600 rounded-lg overflow-hidden">
                    <iframe 
                        title="Power BI Placeholder Dashboard"
                        src={powerBiUrl}
                        frameBorder="0" 
                        allowFullScreen={true}
                        className="w-full h-full min-h-[300px]"
                    ></iframe>
                </div>
            </div>

            {/* Mock Order Data Table */}
            <div className="mt-12 bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
                <h3 className="text-xl font-semibold text-gray-200 mb-4">Raw Order Data</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                            <tr>
                                {['ID', 'Total', 'Items', 'Status', 'Date'].map(header => (
                                    <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 text-sm">
                            {mockOrders.map((order) => (
                                <tr key={order.orderId} className="hover:bg-gray-700">
                                    <td className="px-4 py-2 whitespace-nowrap text-white">{order.orderId}</td>
                                    <td className="px-4 py-2 whitespace-nowrap font-semibold text-yellow-400">
                                        {formatCurrency(order.total || 0)}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-400">
                                        {order.items?.map(item => `${item.name} x${item.qty}`).join(", ") || "—"}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}
                                        >
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-400">
                                        {order.date ? order.date.toLocaleDateString() : "Invalid Date"}
                                    </td>
                                </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );


    // 6. MAIN RENDER LOGIC
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-yellow-400 text-xl">Loading Admin Interface...</div>;
    }
    
    // Fallback message if Firebase never initialized (due to empty config locally)
    if (!isFirebaseReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
                <div className="max-w-lg p-8 rounded-xl bg-gray-800 shadow-2xl border border-yellow-600">
                    <h2 className="text-3xl font-bold text-yellow-400 mb-4">Local Mode Warning</h2>
                    <p className="text-gray-300">
                        The application is running in local mode because no Firebase configuration was detected. 
                        It cannot connect to the database.
                    </p>
                    <p className="mt-4 text-sm text-gray-400">
                        This is expected during local development. For the demo, you can talk about the **database architecture** (Firestore CRUD, DataOps) without showing live interaction.
                    </p>
                </div>
            </div>
        );
    }

    /* const AdminModal = () => (
        <div 
            className={`fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center transition-opacity ${isMenuModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsMenuModalOpen(false)}
        >
            <div 
                className="bg-gray-800 rounded-xl p-8 w-full max-w-lg shadow-2xl border border-gray-700 transform transition-transform duration-300 scale-100"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold text-yellow-400 mb-6 border-b border-gray-700 pb-2">{menuForm.id ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
                <form onSubmit={handleSaveMenu} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                        <input
                            type="text"
                            id="name"
                            value={menuForm.name}
                            onChange={(e) => setMenuForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-yellow-500 focus:border-yellow-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="desc" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea
                            id="desc"
                            value={menuForm.desc}
                            onChange={(e) => setMenuForm(prev => ({ ...prev, desc: e.target.value }))}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-yellow-500 focus:border-yellow-500"
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300 mb-1">Image Filename (e.g., p1.jpg, just the name)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"><Image className="w-5 h-5"/></span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e)}
                                    placeholder="e.g. new_pizza_image.jpg"
                                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-yellow-500 focus:border-yellow-500"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">This should be the filename in your `assets/Food/` folder.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Price ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                id="price"
                                value={menuForm.price}
                                onChange={(e) => setMenuForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-yellow-500 focus:border-yellow-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                            <select
                                id="category"
                                value={menuForm.category}
                                onChange={(e) => setMenuForm(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-yellow-500 focus:border-yellow-500"
                            >
                                {MENU_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat.replace('-', ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col justify-end">
                            <label className="text-sm font-medium text-gray-300 mb-1">Stock Status</label>
                            <label className="inline-flex items-center cursor-pointer p-2 bg-gray-700 rounded-lg border border-gray-600">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={menuForm.isOutOfStock}
                                    onChange={(e) => setMenuForm(prev => ({ ...prev, isOutOfStock: e.target.checked }))}
                                    //onChange={(e) => setMenuForm({ ...menuForm, isOutOfStock: e.target.checked })}
                                />
                                <div className="relative w-11 h-6 bg-gray-500 rounded-full peer peer-focus:ring-2 peer-focus:ring-yellow-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                <span className={`ms-3 text-sm font-medium ${menuForm.isOutOfStock ? 'text-red-400' : 'text-green-400'}`}>
                                    {menuForm.isOutOfStock ? 'OOS' : 'In Stock'}
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    <div className="flex justify-end pt-4 space-x-3">
                        <button
                            type="button"
                            onClick={() => setIsMenuModalOpen(false)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-yellow-600 text-black font-semibold rounded-lg hover:bg-yellow-500 transition"
                        >
                            {menuForm.id ? 'Update Item' : 'Create Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    ); */
    
    return (
        <div className="min-h-screen flex bg-gray-900 text-white font-inter">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-gray-800 flex flex-col z-30 shadow-2xl`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h1 className="text-2xl font-bold text-yellow-400">Sanz <span className="text-white">Admin</span></h1>
                    <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <SidebarButton 
                        name="Dashboard & BI" 
                        icon={LayoutDashboard} 
                        isActive={activeView === 'dashboard'} 
                        onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }} 
                    />
                    <SidebarButton 
                        name="Menu Management (CRUD)" 
                        icon={Utensils} 
                        isActive={activeView === 'menu'} 
                        onClick={() => { setActiveView('menu'); setIsSidebarOpen(false); }} 
                    />

                    <SidebarButton 
                        name="Special Requests" 
                        icon={Utensils} 
                        isActive={activeView === 'special-requests'} 
                        onClick={() => { setActiveView('special-requests'); setIsSidebarOpen(false); }} 
                        
                    />

                    {/* //discard this after using coz fakt storeage made structure sathi ye 
                    <button onClick={seedFakeOrders} className="bg-blue-600 text-white px-4 py-2 rounded-md">
                        seeed fake
                    </button>*/}
                    
                </nav>
                <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
                    <p className="font-semibold text-white mb-1">Authenticated User ID:</p>
                    <p className="break-all">{userId}</p>
                    <p className="mt-2 text-yellow-500">App ID: {appId}</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar for Mobile */}
                <header className="flex items-center justify-between p-4 bg-gray-800 lg:hidden shadow-md">
                    <button className="text-white" onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-yellow-400">Admin</h1>
                </header>

                <main className="flex-1 overflow-y-auto">
                    {activeView === 'dashboard' && renderDashboard()}
                    {activeView === 'menu' && renderMenuManager()}

                    {activeView === "special-requests" && <SpecialRequests />}
                </main>
            </div>
            
            {/* Modal */}
            <AdminModal
            isMenuModalOpen={isMenuModalOpen}
            setIsMenuModalOpen={setIsMenuModalOpen}
            menuForm={menuForm}
            setMenuForm={setMenuForm}
            handleSaveMenu={handleSaveMenu}
            handleImageUpload={handleImageUpload}
            MENU_CATEGORIES={MENU_CATEGORIES}
            />
            {/* <SpecialRequests/> */}
            {/* {activeView === "special-requests" && <SpecialRequests />} */}

            {/* Notification/Message Pop-up */}
            {message && (
                <div 
                    className="fixed bottom-4 right-4 bg-yellow-600 text-black py-3 px-6 rounded-lg shadow-xl transition-opacity duration-300 z-40 font-semibold"
                    onAnimationEnd={() => setMessage('')} // Hide after animation (or use a timeout)
                    style={{ animation: 'fadeInOut 4s ease-in-out' }}
                >
                    {message}
                </div>
            )}
            
            {/* Tailwind CSS utility animations */}
            <style>
                {`
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateY(20px); }
                    10% { opacity: 1; transform: translateY(0); }
                    90% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(20px); }
                }
                `}
            </style>
        </div>
    );
};

const SidebarButton = ({ name, icon: Icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
            isActive 
                ? 'bg-yellow-500 text-black font-bold shadow-md' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
    >
        <Icon className="w-5 h-5 mr-3" />
        <span className="text-sm">{name}</span>
    </button>
);

export default App;