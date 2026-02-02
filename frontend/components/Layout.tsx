import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, Settings, LayoutDashboard, Users, FolderKanban, Brain, CalendarDays, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
    children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const navItems = [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Teams", path: "/teams", icon: Users },
        { label: "Projects", path: "/projects", icon: FolderKanban },
        { label: "AI Coach", path: "/ai-coach", icon: Brain },
        { label: "Meetings", path: "/schedule-meeting", icon: CalendarDays },
    ];

    return (
        <div className="min-h-screen bg-background selection:bg-primary/20">
            {/* Header */}
            <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled
                    ? "bg-white/60 backdrop-blur-xl border-b border-white/20 py-2 shadow-lg"
                    : "bg-transparent py-4 text-sm"
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => navigate("/dashboard")}
                        >
                            <div className="w-12 h-12 premium-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-500 overflow-hidden relative">
                                <motion.div
                                    animate={{ rotate: [0, 10, 0] }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                >
                                    <Sparkles className="w-7 h-7 text-white" />
                                </motion.div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary via-primary-500 to-blue-600 bg-clip-text text-transparent">
                                TaskFlow<span className="text-primary-400">.</span>
                            </span>
                        </motion.div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1 bg-white/40 p-1.5 rounded-2xl border border-white/60 backdrop-blur-md shadow-sm">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 group ${isActive
                                                ? "text-white"
                                                : "text-muted-foreground hover:text-primary hover:bg-white/50"
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-bg"
                                                className="absolute inset-0 premium-gradient rounded-xl shadow-md shadow-primary/20"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <item.icon className={`w-5 h-5 relative z-10 ${isActive ? "text-white" : "group-hover:scale-110 transition-transform"}`} />
                                        <span className="relative z-10">{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* User Menu */}
                        <div className="flex items-center gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="relative h-11 w-11 rounded-2xl premium-gradient p-[2px] shadow-lg shadow-primary/20"
                                    >
                                        <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
                                            <span className="text-primary font-bold text-lg">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </motion.button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 glass-morphism rounded-3xl p-2 mt-4">
                                    <DropdownMenuLabel className="flex flex-col space-y-1.5 p-4">
                                        <p className="text-base font-bold text-foreground">
                                            {user?.name}
                                        </p>
                                        <p className="text-sm font-medium text-muted-foreground/80">
                                            {user?.email}
                                        </p>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/30 mx-2" />
                                    <DropdownMenuItem onClick={() => navigate("/profile")} className="rounded-xl mt-1 focus:bg-primary/10">
                                        <User className="w-4 h-4 mr-3" />
                                        <span className="font-medium">Account Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate("/settings")} className="rounded-xl focus:bg-primary/10">
                                        <Settings className="w-4 h-4 mr-3" />
                                        <span className="font-medium">System Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/30 mx-2" />
                                    <DropdownMenuItem onClick={handleLogout} className="rounded-xl mb-1 focus:bg-destructive/10 text-destructive">
                                        <LogOut className="w-4 h-4 mr-3" />
                                        <span className="font-medium">Terminate Session</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <button
                                className="md:hidden h-11 w-11 rounded-2xl bg-white/50 border border-white/80 flex items-center justify-center shadow-sm"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.nav
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden overflow-hidden border-t border-white/20 bg-white/60 backdrop-blur-xl"
                        >
                            <div className="p-4 space-y-2">
                                {navItems.map((item) => (
                                    <button
                                        key={item.path}
                                        onClick={() => {
                                            navigate(item.path);
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex items-center gap-4 w-full px-4 py-4 text-foreground font-bold hover:bg-primary/10 rounded-2xl transition-colors"
                                    >
                                        <item.icon className="w-6 h-6 text-primary" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </motion.nav>
                    )}
                </AnimatePresence>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.98 }}
                        transition={{
                            type: "spring",
                            stiffness: 100,
                            damping: 20
                        }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
