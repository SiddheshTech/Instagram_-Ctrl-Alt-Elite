import React from 'react';
import { 
  Instagram, 
  Home, 
  Search, 
  Compass, 
  Clapperboard, 
  MessageCircle, 
  Heart, 
  PlusSquare, 
  Menu,
  Grid
} from 'lucide-react';
import { currentUser } from '../data';

const navItems = [
  { icon: Home, label: 'Home', isActive: true },
  { icon: Search, label: 'Search' },
  { icon: Compass, label: 'Explore' },
  { icon: Clapperboard, label: 'Reels' },
  { icon: MessageCircle, label: 'Messages', badge: '9+' },
  { icon: Heart, label: 'Notifications', dotBadge: true },
  { icon: PlusSquare, label: 'Create' },
  { isProfile: true, label: 'Profile' },
];

export function Sidebar() {
  return (
    <div className="fixed top-0 left-0 h-screen w-[244px] border-r border-gray-200 bg-white px-3 py-6 flex flex-col justify-between hidden md:flex z-50">
      <div>
        <div className="px-3 pb-6 pt-2 mb-2">
          <Instagram className="w-6 h-6" strokeWidth={1.5} />
        </div>
        
        <nav className="flex flex-col gap-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <a 
                key={index} 
                href="#" 
                className={`flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors group relative ${item.isActive ? 'font-bold' : ''}`}
              >
                <div className="relative">
                  {item.isProfile ? (
                    <img 
                      src={currentUser.avatar} 
                      alt="Profile" 
                      className={`w-6 h-6 rounded-full object-cover ${item.isActive ? 'border border-black' : ''}`}
                    />
                  ) : (
                    Icon && <Icon className={`w-6 h-6 group-hover:scale-105 transition-transform ${item.isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                  )}
                  
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full border-2 border-white">
                      {item.badge}
                    </span>
                  )}
                  {item.dotBadge && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <span className="text-[15px]">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-1">
        <a href="#" className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors group">
          <Menu className="w-6 h-6 stroke-[1.5px] group-hover:scale-105 transition-transform" />
          <span className="text-[15px]">More</span>
        </a>
        <a href="#" className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors group">
          <Grid className="w-6 h-6 stroke-[1.5px] group-hover:scale-105 transition-transform" />
          <span className="text-[15px]">Also from Meta</span>
        </a>
      </div>
    </div>
  );
}
