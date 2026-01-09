import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Play, Globe2, Mic, Film, Volume2, FileText, Image, Zap, Shield, Users, Star, Check, ChevronRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import bathAiLogo from "@/assets/bath-ai-logo.png";

// Floating 3D shapes for hero
const FloatingShape = ({
  className,
  delay = 0,
  duration = 6,
  children
}: {
  className?: string;
  delay?: number;
  duration?: number;
  children: React.ReactNode;
}) => <motion.div className={className} initial={{
  y: 0,
  rotate: 0
}} animate={{
  y: [-20, 20, -20],
  rotate: [0, 5, -5, 0]
}} transition={{
  duration,
  repeat: Infinity,
  ease: "easeInOut",
  delay
}}>
    {children}
  </motion.div>;

// Particle component
const Particle = ({
  size,
  x,
  y,
  delay
}: {
  size: number;
  x: string;
  y: string;
  delay: number;
}) => <motion.div className="absolute rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" style={{
  width: size,
  height: size,
  left: x,
  top: y
}} initial={{
  opacity: 0,
  scale: 0
}} animate={{
  opacity: [0, 0.6, 0],
  scale: [0, 1, 0.5],
  y: [0, -100]
}} transition={{
  duration: 4,
  repeat: Infinity,
  ease: "easeOut",
  delay
}} />;

// Generate particles
const particles = Array.from({
  length: 20
}, (_, i) => ({
  id: i,
  size: Math.random() * 8 + 4,
  x: `${Math.random() * 100}%`,
  y: `${Math.random() * 100}%`,
  delay: Math.random() * 4
}));
const features = [{
  icon: Film,
  title: "Neural Video Dubbing",
  description: "AI-powered video translation with voice cloning and lip-sync technology.",
  color: "from-violet-500 to-purple-600"
}, {
  icon: Mic,
  title: "Voice Cloning Lab",
  description: "Clone any voice with just 30 seconds of audio for authentic localization.",
  color: "from-blue-500 to-cyan-600"
}, {
  icon: Globe2,
  title: "50+ Languages",
  description: "Enterprise-grade translation engine supporting 50+ languages with high accuracy.",
  color: "from-emerald-500 to-teal-600"
}, {
  icon: Volume2,
  title: "Native Voice Chat",
  description: "Real-time conversational AI with ultra-low latency voice interaction.",
  color: "from-orange-500 to-amber-600"
}, {
  icon: FileText,
  title: "Document AI",
  description: "Extract data, summarize, and analyze documents with intelligent processing.",
  color: "from-pink-500 to-rose-600"
}, {
  icon: Image,
  title: "AI Image Studio",
  description: "Create, edit, and enhance images with state-of-the-art AI models.",
  color: "from-indigo-500 to-blue-600"
}];
const stats = [{
  value: "50+",
  label: "Languages"
}, {
  value: "10M+",
  label: "Videos Processed"
}, {
  value: "500K+",
  label: "Active Users"
}, {
  value: "99.9%",
  label: "Uptime"
}];
const testimonials = [{
  name: "Sarah Chen",
  role: "Content Creator",
  text: "Bath AI transformed my workflow. I can now reach global audiences effortlessly.",
  avatar: "S"
}, {
  name: "Marcus Johnson",
  role: "Marketing Director",
  text: "The voice cloning quality is incredible. Our localized content sounds native.",
  avatar: "M"
}, {
  name: "Yuki Tanaka",
  role: "Video Producer",
  text: "Finally, an AI tool that understands Asian languages perfectly.",
  avatar: "Y"
}];
const pricingPlans = [{
  name: "Basic",
  price: "Free",
  description: "Perfect for getting started",
  features: ["5 video translations/month", "Basic voice synthesis", "8 languages", "720p export"]
}, {
  name: "Plus",
  price: "$29",
  description: "For content creators",
  features: ["50 video translations/month", "Voice cloning", "25 languages", "1080p export", "Priority support"],
  popular: true
}, {
  name: "Max",
  price: "$99",
  description: "For teams & businesses",
  features: ["Unlimited translations", "Advanced voice cloning", "50+ languages", "4K export", "API access", "Dedicated support"]
}];
const Home = () => {
  return <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50/50">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={bathAiLogo} alt="Bath AI" className="w-9 h-9 object-contain" />
              <span className="text-xl font-bold text-slate-800">Bath AI</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Testimonials</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-slate-600">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25">
                  Get Started <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section with 3D Floating Elements */}
        <section className="relative pt-32 pb-20 overflow-hidden min-h-[90vh] flex items-center">
          {/* Animated Background Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(particle => <Particle key={particle.id} {...particle} />)}
          </div>

          {/* Gradient Orbs */}
          <motion.div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2]
        }} transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }} />
          <motion.div className="absolute top-40 right-10 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.35, 0.2]
        }} transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }} />
          <motion.div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl" animate={{
          scale: [1, 1.3, 1],
          x: [-20, 20, -20]
        }} transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }} />

          {/* Floating 3D Shapes - Left Side */}
          <FloatingShape className="absolute top-32 left-[5%] hidden lg:block" delay={0} duration={7}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-xl shadow-cyan-500/30 flex items-center justify-center">
              <Mic className="w-8 h-8 text-white" />
            </div>
          </FloatingShape>

          <FloatingShape className="absolute top-1/2 left-[8%] hidden lg:block" delay={1} duration={8}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 shadow-xl shadow-violet-500/30 flex items-center justify-center">
              <Film className="w-7 h-7 text-white" />
            </div>
          </FloatingShape>

          <FloatingShape className="absolute bottom-32 left-[12%] hidden lg:block" delay={2} duration={6}>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-500/30 flex items-center justify-center">
              <Globe2 className="w-6 h-6 text-white" />
            </div>
          </FloatingShape>

          {/* Floating 3D Shapes - Right Side */}
          <FloatingShape className="absolute top-40 right-[8%] hidden lg:block" delay={0.5} duration={9}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 shadow-xl shadow-pink-500/30 flex items-center justify-center">
              <Image className="w-7 h-7 text-white" />
            </div>
          </FloatingShape>

          <FloatingShape className="absolute top-1/2 right-[5%] hidden lg:block" delay={1.5} duration={7}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl shadow-amber-500/30 flex items-center justify-center">
              <Volume2 className="w-8 h-8 text-white" />
            </div>
          </FloatingShape>

          <FloatingShape className="absolute bottom-40 right-[10%] hidden lg:block" delay={2.5} duration={8}>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-500 shadow-xl shadow-indigo-500/30 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </FloatingShape>

          {/* Floating geometric shapes */}
          <motion.div className="absolute top-24 right-[20%] w-8 h-8 border-2 border-cyan-400/40 rounded-lg hidden md:block" animate={{
          rotate: 360
        }} transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }} />
          <motion.div className="absolute bottom-32 left-[20%] w-6 h-6 border-2 border-violet-400/40 rounded-full hidden md:block" animate={{
          rotate: -360,
          scale: [1, 1.2, 1]
        }} transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }} />
          <motion.div className="absolute top-1/3 left-[25%] w-4 h-4 bg-pink-400/30 rounded-sm hidden md:block" animate={{
          rotate: 180,
          y: [-10, 10, -10]
        }} transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }} />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-600 text-sm font-medium mb-8" initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6
            }}>
                <motion.div animate={{
                rotate: 360
              }} transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}>
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                Powered by Advanced AI
              </motion.div>
              
              <motion.h1 className="text-5xl md:text-7xl font-bold text-slate-800 mb-6 leading-tight" initial={{
              opacity: 0,
              y: 30
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.7,
              delay: 0.1
            }}>
                Create{" "}
                <motion.span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent inline-block" animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }} transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }} style={{
                backgroundSize: "200% 200%"
              }}>
                  Global Content
                </motion.span>
                <br />with AI
              </motion.h1>
              
              <motion.p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10" initial={{
              opacity: 0,
              y: 30
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.7,
              delay: 0.2
            }}>
                The complete AI production suite for video dubbing, voice cloning, translation, and content creation. Reach global audiences in 50+ languages.
              </motion.p>
              
              <motion.div className="flex flex-wrap justify-center gap-4" initial={{
              opacity: 0,
              y: 30
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.7,
              delay: 0.3
            }}>
                <Link to="/auth">
                  <motion.div whileHover={{
                  scale: 1.05
                }} whileTap={{
                  scale: 0.98
                }}>
                    <Button size="lg" className="h-14 px-8 text-base bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-xl hover:shadow-blue-500/25 transition-all">
                      Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </Link>
                <motion.div whileHover={{
                scale: 1.05
              }} whileTap={{
                scale: 0.98
              }}>
                  <Button variant="outline" size="lg" className="h-14 px-8 text-base border-slate-300 hover:bg-slate-100">
                    <Play className="w-5 h-5 mr-2" /> Watch Demo
                  </Button>
                </motion.div>
              </motion.div>

              {/* Stats */}
              <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20" initial={{
              opacity: 0,
              y: 40
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.8,
              delay: 0.5
            }}>
                {stats.map((stat, index) => <motion.div key={stat.label} className="text-center" initial={{
                opacity: 0,
                scale: 0.8
              }} animate={{
                opacity: 1,
                scale: 1
              }} transition={{
                duration: 0.5,
                delay: 0.6 + index * 0.1
              }}>
                    <motion.div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent" whileHover={{
                  scale: 1.1
                }}>
                      {stat.value}
                    </motion.div>
                    <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                  </motion.div>)}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                Everything You Need
              </h2>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Professional-grade AI tools for creators, businesses, and enterprises.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((feature, index) => {
              const Icon = feature.icon;
              return <div key={feature.title} className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 animate-fade-in" style={{
                animationDelay: `${index * 100}ms`
              }}>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{feature.title}</h3>
                    <p className="text-slate-500 text-sm">{feature.description}</p>
                  </div>;
            })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                Simple. Fast. Powerful.
              </h2>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Get started in minutes with our intuitive workflow.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[{
              step: "1",
              title: "Upload",
              description: "Upload your video, audio, or document"
            }, {
              step: "2",
              title: "Configure",
              description: "Select languages and voice settings"
            }, {
              step: "3",
              title: "Export",
              description: "Download your AI-enhanced content"
            }].map((item, index) => <div key={item.step} className="text-center animate-fade-in" style={{
              animationDelay: `${index * 150}ms`
            }}>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg shadow-blue-500/25">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-slate-500">{item.description}</p>
                </div>)}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                Loved by Creators Worldwide
              </h2>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Join thousands of creators who trust Bath AI for their content.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => <div key={testimonial.name} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 animate-fade-in" style={{
              animationDelay: `${index * 100}ms`
            }}>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-slate-600 mb-4">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{testimonial.name}</p>
                      <p className="text-sm text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>)}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Choose the plan that fits your needs. No hidden fees.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {pricingPlans.map((plan, index) => <div key={plan.name} className={`p-6 rounded-2xl border-2 transition-all animate-fade-in ${plan.popular ? 'bg-gradient-to-b from-cyan-50 to-blue-50 border-cyan-500 shadow-xl shadow-cyan-500/10' : 'bg-white border-slate-200 hover:border-slate-300'}`} style={{
              animationDelay: `${index * 100}ms`
            }}>
                  {plan.popular && <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold mb-4">
                      <Star className="w-3 h-3" /> Most Popular
                    </div>}
                  <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-4xl font-bold text-slate-800">{plan.price}</span>
                    {plan.price !== "Free" && <span className="text-slate-500">/month</span>}
                  </div>
                  <p className="text-slate-500 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map(feature => <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-cyan-500" />
                        {feature}
                      </li>)}
                  </ul>
                  <Link to="/auth" className="block">
                    <Button className={`w-full ${plan.popular ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25' : ''}`} variant={plan.popular ? "default" : "outline"}>
                      Get Started <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>)}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl p-12 md:p-16 relative overflow-hidden">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              </div>
              <div className="relative z-10">
                <Brain className="w-12 h-12 text-white/80 mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Ready to Go Global?
                </h2>
                <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                  Start creating multilingual content today. No credit card required.
                </p>
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="bg-white text-slate-800 hover:bg-white/90">
                    Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-slate-200">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <img src={bathAiLogo} alt="Bath AI" className="w-8 h-8 object-contain" />
                <span className="text-sm text-slate-500">© 2024 Bath AI. All rights reserved.</span>
              </div>
              <div className="flex flex-col items-center gap-2 md:order-none order-first">
                <span className="text-xs text-slate-400">Powered by</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">​   Bath AI </span>
                  <span className="text-slate-300">•</span>
                  
                  <span className="text-slate-300">
                </span>
                  
                </div>
              </div>
              <div className="flex items-center gap-8">
                <a href="#features" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">Features</a>
                <a href="#pricing" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">Pricing</a>
                <a href="#" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">Privacy</a>
                <a href="#" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">Terms</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>;
};
export default Home;