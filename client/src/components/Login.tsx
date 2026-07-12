import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export function Login({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLoginMode) {
        const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          emailOrUsername: username,
          password
        });
        onLogin(res.data.token, res.data.user);
      } else {
        const res = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
          username,
          password,
          email,
          fullName
        });
        onLogin(res.data.token, res.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during authentication.');
    }
  };
  return (
    <div className="min-h-screen vintage-bg flex flex-col font-sans">
      <main className="flex-1 flex justify-center items-center p-4 gap-12 mt-8">
         {/* Left Side: Mockup Image */}
         <div className="hidden md:flex flex-col items-center w-[450px] h-[550px] relative">
            {/* Phone 1 (Back/Angled) */}
            <div className="absolute top-4 left-4 w-[240px] h-[480px] bg-black rounded-[35px] border-[4px] border-[#333] shadow-[-15px_15px_20px_rgba(0,0,0,0.15)] overflow-hidden transform -rotate-12 z-10 flex flex-col">
              <div className="w-full h-16 bg-black flex justify-center items-center shrink-0">
                <div className="w-12 h-2 rounded-full bg-[#222]"></div>
              </div>
              <div className="flex-1 bg-white relative">
                 <div className="w-full h-12 retro-header flex items-center justify-center">
                    <span className="retro-title text-white text-2xl mt-1">Instagram</span>
                 </div>
                 <div className="p-2 pb-0">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                     <span className="font-bold text-[#125688] text-xs">kevin</span>
                   </div>
                   <div className="w-full aspect-square bg-gray-200" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1551316679-9c6ae9dec224?auto=format&fit=crop&q=80&w=400)', backgroundSize: 'cover'}} />
                 </div>
              </div>
              <div className="w-full h-16 bg-black flex justify-center items-center shrink-0">
                <div className="w-10 h-10 rounded-full border-2 border-[#222]"></div>
              </div>
            </div>

            {/* Phone 2 (Front/Straight) */}
            <div className="absolute bottom-4 right-8 w-[250px] h-[500px] bg-black rounded-[35px] border-[4px] border-[#444] shadow-[15px_15px_30px_rgba(0,0,0,0.2)] overflow-hidden z-20 flex flex-col">
              <div className="w-full h-16 bg-black flex justify-center items-center shrink-0 relative">
                <div className="w-12 h-2 rounded-full bg-[#222]"></div>
                <div className="w-2 h-2 rounded-full bg-[#222] absolute left-1/3"></div>
              </div>
              <div className="flex-1 bg-white relative overflow-hidden">
                 <div className="w-full h-12 retro-header flex items-center justify-between px-3">
                    <span className="text-white">↺</span>
                    <span className="retro-title text-white text-2xl mt-1">Instagram</span>
                    <span className="text-white">+</span>
                 </div>
                 <div className="p-2 pb-0">
                   <div className="flex items-center gap-2 mb-2">
                     <img src="https://i.pravatar.cc/150?u=shrushti" className="w-6 h-6 rounded-full border border-gray-300" alt="avatar" />
                     <span className="font-bold text-[#125688] text-xs">shrushtiganacharya</span>
                     <span className="ml-auto text-[10px] text-gray-400">12h</span>
                   </div>
                   <div className="w-full aspect-square bg-gray-200" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400)', backgroundSize: 'cover'}} />
                   <div className="mt-2 flex gap-2">
                     <button className="retro-button px-2 py-1 flex-1 text-xs rounded shadow-sm text-gray-600">♥ Like</button>
                     <button className="retro-button px-2 py-1 flex-1 text-xs rounded shadow-sm text-gray-600">Comment</button>
                   </div>
                 </div>
                 {/* Retro Tab Bar */}
                 <div className="absolute bottom-0 w-full h-10 retro-tab-bar flex justify-around items-center">
                    <div className="w-4 h-4 bg-white/50 rounded-sm"></div>
                    <div className="w-4 h-4 bg-white/50 rounded-full"></div>
                    <div className="w-6 h-6 bg-gradient-to-b from-[#4a7698] to-[#254f73] border border-[#1a3750] rounded-sm"></div>
                    <div className="w-4 h-4 bg-white/50"></div>
                    <div className="w-4 h-4 bg-white/50 rounded-sm"></div>
                 </div>
              </div>
              <div className="w-full h-16 bg-black flex justify-center items-center shrink-0">
                <div className="w-10 h-10 rounded-full border-2 border-[#222]"></div>
              </div>
            </div>
         </div>

         {/* Right Side: Form */}
         <div className="w-[350px] flex flex-col gap-3">
            <div className="vintage-panel p-10 pb-6 flex flex-col items-center">
               <div className="flex items-center gap-3 mb-8">
                 <img src="/favicon.png" alt="Instagram Logo" className="w-14 h-14 object-contain" />
                 <h1 className="retro-title text-[56px] text-[#222] leading-none mt-2" style={{ textShadow: 'none' }}>Instagram</h1>
               </div>
               <form 
                 className="w-full flex flex-col gap-2" 
                 onSubmit={handleSubmit}
               >
                 {!isLoginMode && (
                   <>
                     <input 
                       className="w-full vintage-input px-2 py-2 text-sm focus:outline-none focus:border-[#a8a8a8] text-[#262626] transition-colors placeholder:text-[#999]" 
                       placeholder="Email" 
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       required
                     />
                     <input 
                       className="w-full vintage-input px-2 py-2 text-sm focus:outline-none focus:border-[#a8a8a8] text-[#262626] transition-colors placeholder:text-[#999]" 
                       placeholder="Full Name" 
                       value={fullName}
                       onChange={(e) => setFullName(e.target.value)}
                       required
                     />
                   </>
                 )}
                 <input 
                   className="w-full vintage-input px-2 py-2 text-sm focus:outline-none focus:border-[#a8a8a8] text-[#262626] transition-colors placeholder:text-[#999]" 
                   placeholder={isLoginMode ? "Username or Email" : "Username"} 
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                   required
                 />
                 <input 
                   className="w-full vintage-input px-2 py-2 text-sm focus:outline-none focus:border-[#a8a8a8] text-[#262626] transition-colors placeholder:text-[#999]" 
                   type="password" 
                   placeholder="Password" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                 />
                 {error && (
                   <div className="text-red-500 text-xs text-center mt-1">{error}</div>
                 )}
                 <button 
                   type="submit" 
                   className="w-full retro-blue-button font-bold py-1.5 rounded-[3px] mt-2 text-[15px] cursor-pointer"
                 >
                   {isLoginMode ? "Log in" : "Sign up"}
                 </button>
               </form>
               <div className="mt-5 flex items-center w-full">
                 <div className="flex-1 h-[1px] bg-[#dbdbdb]" />
                 <span className="px-4 text-[#999] font-bold text-[13px]">OR</span>
                 <div className="flex-1 h-[1px] bg-[#dbdbdb]" />
               </div>
               <button className="mt-5 text-[#385185] font-bold text-[14px] flex items-center gap-2 hover:opacity-80 transition-opacity">
                 <span className="text-[20px] font-serif leading-none mb-0.5">f</span>
                 Log in with Facebook
               </button>
               <button className="mt-4 text-[#003569] text-[12px] hover:underline">Forgot password?</button>
            </div>
            
            <div className="vintage-panel py-5 text-center">
               <span className="text-[14px] text-[#262626]">
                 {isLoginMode ? "Don't have an account? " : "Have an account? "}
                 <button 
                   className="text-[#3897f0] font-bold hover:underline"
                   onClick={() => {
                     setIsLoginMode(!isLoginMode);
                     setError('');
                   }}
                 >
                   {isLoginMode ? "Sign up" : "Log in"}
                 </button>
               </span>
            </div>
            
            <div className="text-center mt-3">
              <p className="text-[14px] text-[#262626] mb-4">Get the app.</p>
              <div className="flex justify-center gap-2">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                  alt="Download on the App Store" 
                  className="h-10 cursor-pointer hover:opacity-80"
                />
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                  alt="Get it on Google Play" 
                  className="h-10 cursor-pointer hover:opacity-80"
                />
              </div>
            </div>
         </div>
      </main>
      
      <footer className="py-12 flex flex-col items-center gap-4 text-[12px] font-bold text-[#003569] uppercase tracking-wide">
         <div className="flex gap-x-4 gap-y-2 flex-wrap justify-center max-w-[800px]">
           <a href="#" className="hover:text-[#262626]">About Us</a>
           <a href="#" className="hover:text-[#262626]">Support</a>
           <a href="#" className="hover:text-[#262626]">Blog</a>
           <a href="#" className="hover:text-[#262626]">Press</a>
           <a href="#" className="hover:text-[#262626]">API</a>
           <a href="#" className="hover:text-[#262626]">Jobs</a>
           <a href="#" className="hover:text-[#262626]">Privacy</a>
           <a href="#" className="hover:text-[#262626]">Terms</a>
         </div>
         <span className="text-[#999] font-normal tracking-normal uppercase text-[11px]">© 2012 Instagram</span>
      </footer>
    </div>
  );
}
