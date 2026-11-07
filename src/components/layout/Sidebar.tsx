/**
 * Sidebar Navigation Component
 * Professional, clean design conforming to Section 7 design guidelines.
 */

import React from 'react';
import {
  LayoutDashboard,
  PlayCircle,
  Video,
  BarChart3,
  GitCompare,
  History,
  Settings,
  Info,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

export type NavigationTab =
  | 'dashboard'
  | 'simulation'
  | 'detection'
  | 'analytics'
  | 'comparison'
  | 'history'
  | 'settings'
  | 'about';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  systemActive?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  systemActive = true,
}) => {
  const navItems: Array<{ id: NavigationTab; label: string; icon: React.ElementType; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'simulation', label: 'Live Simulation', icon: PlayCircle, badge: 'Live' },
    { id: 'detection', label: 'Vehicle Detection', icon: Video, badge: 'CV' },
    { id: 'analytics', label: 'Traffic Analytics', icon: BarChart3 },
    { id: 'comparison', label: 'Algorithm Comparison', icon: GitCompare },
    { id: 'history', label: 'Simulation History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About System', icon: Info },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col flex-shrink-0 min-h-screen select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight tracking-tight">
              Smart Traffic
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Intelligent Signal Control
            </p>
          </div>
        </div>

        {/* Live System Badge */}
        <div className="mt-4 flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-md border border-slate-700/60 text-xs shadow-xs">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${systemActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-slate-300 font-medium">
              {systemActive ? 'System Active' : 'System Paused'}
            </span>
          </div>
          <span className="text-[10px] bg-blue-900/60 text-blue-300 font-mono px-1.5 py-0.5 rounded border border-blue-700/40">
            AI OPTIMIZED
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/35'
                  : 'bg-slate-900/60 text-slate-300 border-transparent hover:bg-slate-800 hover:text-white hover:border-slate-700/60 shadow-xs hover:shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                    isActive
                      ? 'bg-blue-700 text-blue-100'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Safety Interlocks</span>
          </span>
          <span className="text-emerald-400 font-medium">100% Locked</span>
        </div>
        <div className="text-[10px] text-slate-500 pt-1">
          Smart Traffic Light v2.4 (OpenCV + YOLO + Adaptive Controller)
        </div>
      </div>
    </aside>
  );
};
