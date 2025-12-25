
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appService } from '../services/appService';
import Button from '../components/Button';
import { User, UserRole } from '../types';
import { Shield, Users, UserCog, UserCheck, ShieldAlert, LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [devUsers, setDevUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setDevUsers(appService.getDevUsers());
  }, []);

  const performLogin = async (u: string, p: string) => {
    setIsLoading(true);
    setError('');

    try {
      const user = await appService.login(u, p);
      if (user) {
        onLogin(user);
        // Navigate to root to let App.tsx handle role-based redirection
        navigate('/');
      } else {
        setError('Invalid username or password.');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(username, password);
  };

  const handleQuickLogin = (u: User) => {
    setUsername(u.username);
    setPassword(u.password || '');
    performLogin(u.username, u.password || '');
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return <ShieldAlert size={16} />;
      case UserRole.ADMIN: return <Shield size={16} />;
      case UserRole.UW_ADMIN: return <UserCog size={16} />;
      case UserRole.UNDERWRITER: return <UserCheck size={16} />;
      default: return <Users size={16} />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return 'bg-purple-100 text-purple-700 border-purple-200';
      case UserRole.ADMIN: return 'bg-blue-100 text-blue-700 border-blue-200';
      case UserRole.UW_ADMIN: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case UserRole.UNDERWRITER: return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Left Side: Login Form */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-12 lg:p-16 bg-white shadow-xl z-10">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-10">
             <h1 className="text-4xl font-bold text-brand-900 mb-2">GIG Portal</h1>
             <p className="text-brand-600 text-lg">Workflow & eQRF Management System</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}

            <Button type="submit" className="w-full py-3 text-lg font-bold shadow-md hover:shadow-lg transform active:scale-95 transition-all" isLoading={isLoading}>
              Sign In
            </Button>
          </form>
        </div>
      </div>

      {/* Right Side: Dev Sandbox Access */}
      <div className="flex-1 bg-gray-100 p-8 md:p-12 overflow-y-auto">
         <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="bg-brand-600 text-white p-2 rounded mr-3"><LogIn size={20}/></span>
              Quick Login (Dev Mode)
            </h2>
            <p className="text-gray-500 mb-8 text-sm">Select a user profile below to automatically populate credentials and sign in.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
               {devUsers.map(u => (
                 <button 
                    key={u.id}
                    onClick={() => handleQuickLogin(u)}
                    className="flex flex-col text-left bg-white p-4 rounded-xl border border-gray-200 hover:border-brand-500 hover:shadow-md transition-all group"
                 >
                    <div className="flex justify-between items-start w-full mb-3">
                       <span className={`px-2 py-1 rounded text-xs font-bold border flex items-center ${getRoleColor(u.role)}`}>
                          <span className="mr-1">{getRoleIcon(u.role)}</span>
                          {u.role.replace('_', ' ')}
                       </span>
                    </div>
                    <div className="mb-2">
                       <h3 className="font-bold text-gray-900 group-hover:text-brand-600">{u.fullName}</h3>
                       <p className="text-xs text-gray-400">ID: {u.id}</p>
                    </div>
                    <div className="mt-auto pt-3 border-t border-gray-100 w-full text-xs space-y-1 font-mono text-gray-600">
                       <div className="flex justify-between">
                         <span className="text-gray-400">User:</span>
                         <span>{u.username}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-400">Pass:</span>
                         <span>{u.password}</span>
                       </div>
                    </div>
                 </button>
               ))}
            </div>
         </div>
      </div>

    </div>
  );
};

export default Login;
