import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Check, Circle, LogOut, User, Lock, Mail } from 'lucide-react';
import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  onSnapshot
} from 'firebase/firestore';

// CONFIGURATION FIREBASE
// Remplacez ces valeurs par votre configuration Firebase
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "votre-app-id"
};

export default function TodoApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all');

  // Simuler Firebase Auth - REMPLACER PAR VRAIES FONCTIONS FIREBASE
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      loginForm.email, 
      loginForm.password
    );
    setCurrentUser(userCredential.user);
    setIsLoggedIn(true);
  } catch (err) {
    setError('Email ou mot de passe incorrect');
  } finally {
    setLoading(false);
  }
};

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerForm.email, registerForm.password);
      await updateProfile(userCredential.user, { displayName: registerForm.name });
      
      
      setCurrentUser({
        uid: 'new-uid-' + Date.now(),
        email: registerForm.email,
        displayName: registerForm.name
      });
      setIsLoggedIn(true);
      setRegisterForm({ name: '', email: '', password: '' });
      setIsRegistering(false);
    } catch (err) {
      setError('Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
    setCurrentUser(null);
    setTasks([]);
  };

  // Charger les tâches depuis Firestore
  useEffect(() => {
    if (currentUser) {
      loadTasks();
    }
  }, [currentUser]);

  const loadTasks = async () => {
    if (!currentUser) return;
    
    const q = query(collection(db, 'tasks'), where('userId', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);
    const loadedTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTasks(loadedTasks);
    
    // Simulation pour la démo
    
  };

  const addTask = async () => {
    if (!input.trim() || !currentUser) return;
    
    const newTask = {
      text: input,
      completed: false,
      userId: currentUser.uid,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);
      
      
    } catch (err) {
      console.error('Erreur ajout tâche:', err);
    }
  };

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      await updateDoc(doc(db, 'tasks', id), { completed: !task.completed });
      
      // Mise à jour locale
      setTasks(tasks.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      ));
    } catch (err) {
      console.error('Erreur mise à jour tâche:', err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
      
      // Suppression locale
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      console.error('Erreur suppression tâche:', err);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const stats = {
    total: tasks.length,
    active: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length
  };

  // Login/Register Page
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white text-center">
            <h1 className="text-4xl font-bold mb-2">To-Do List</h1>
            <p className="text-purple-100">Avec Firebase Auth</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Toggle buttons */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setIsRegistering(false)}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  !isRegistering
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => setIsRegistering(true)}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  isRegistering
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Inscription
              </button>
            </div>

            {!isRegistering ? (
              // Login Form
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500"
                      placeholder="votre@email.com"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500"
                      placeholder="••••••••"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>

                <div className="text-center text-xs text-gray-500 mt-4 p-3 bg-yellow-50 rounded-lg">
                  ⚠️ Version démo - Configurez Firebase pour l'utilisation réelle
                </div>
              </form>
            ) : (
              // Register Form
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500"
                      placeholder="Votre nom"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500"
                      placeholder="votre@email.com"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500"
                      placeholder="••••••••"
                      required
                      minLength="6"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Inscription...' : 'S\'inscrire'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Todo List Page (when logged in)
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with logout */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Ma To-Do List</h1>
                <p className="text-purple-100">Bienvenue, {currentUser?.displayName || currentUser?.email} !</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Actives</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Terminées</div>
            </div>
          </div>

          {/* Input */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                placeholder="Ajouter une nouvelle tâche..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button
                onClick={addTask}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
              >
                <Plus size={20} />
                Ajouter
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 p-6 border-b border-gray-200">
            {['all', 'active', 'completed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === f
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {f === 'all' ? 'Toutes' : f === 'active' ? 'Actives' : 'Terminées'}
              </button>
            ))}
          </div>

          {/* Tasks List */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Circle size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">Aucune tâche à afficher</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className="group flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        task.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-purple-500'
                      }`}
                    >
                      {task.completed && <Check size={16} className="text-white" />}
                    </button>
                    <span
                      className={`flex-1 ${
                        task.completed
                          ? 'line-through text-gray-400'
                          : 'text-gray-800'
                      }`}
                    >
                      {task.text}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}