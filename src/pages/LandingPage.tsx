import { useNavigate } from "react-router-dom";
import { Cpu, PenTool, Image, LayoutGrid, ArrowRight, Sparkles, Zap, Layers, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Animated grid background (canvas)                                  */
/* ------------------------------------------------------------------ */
const BlueprintGrid = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        let time = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const draw = () => {
            time += 0.003;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const spacing = 40;
            const cols = Math.ceil(canvas.width / spacing);
            const rows = Math.ceil(canvas.height / spacing);

            // grid lines
            ctx.strokeStyle = "hsla(190,60%,20%,0.25)";
            ctx.lineWidth = 0.5;
            for (let i = 0; i <= cols; i++) {
                ctx.beginPath();
                ctx.moveTo(i * spacing, 0);
                ctx.lineTo(i * spacing, canvas.height);
                ctx.stroke();
            }
            for (let j = 0; j <= rows; j++) {
                ctx.beginPath();
                ctx.moveTo(0, j * spacing);
                ctx.lineTo(canvas.width, j * spacing);
                ctx.stroke();
            }

            // glowing dots at intersections
            for (let i = 0; i <= cols; i++) {
                for (let j = 0; j <= rows; j++) {
                    const pulse = Math.sin(time * 2 + i * 0.3 + j * 0.5) * 0.5 + 0.5;
                    const alpha = 0.05 + pulse * 0.15;
                    ctx.fillStyle = `hsla(190,90%,50%,${alpha})`;
                    ctx.beginPath();
                    ctx.arc(i * spacing, j * spacing, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // scan line
            const scanY = ((time * 80) % (canvas.height + 200)) - 100;
            const gradient = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
            gradient.addColorStop(0, "hsla(190,100%,60%,0)");
            gradient.addColorStop(0.5, "hsla(190,100%,60%,0.06)");
            gradient.addColorStop(1, "hsla(190,100%,60%,0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, scanY - 60, canvas.width, 120);

            animationId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
};

/* ------------------------------------------------------------------ */
/*  Floating particles                                                 */
/* ------------------------------------------------------------------ */
const Particles = () => {
    const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 10,
        size: 2 + Math.random() * 3,
    }));

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full animate-float-particle"
                    style={{
                        left: `${p.left}%`,
                        bottom: "-10px",
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        background: `hsla(190,90%,50%,${0.15 + Math.random() * 0.25})`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    }}
                />
            ))}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Typewriter hook                                                    */
/* ------------------------------------------------------------------ */
const useTypewriter = (text: string, speed = 40) => {
    const [displayed, setDisplayed] = useState("");
    const [done, setDone] = useState(false);

    useEffect(() => {
        let i = 0;
        setDisplayed("");
        setDone(false);
        const interval = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) {
                clearInterval(interval);
                setDone(true);
            }
        }, speed);
        return () => clearInterval(interval);
    }, [text, speed]);

    return { displayed, done };
};

/* ------------------------------------------------------------------ */
/*  Feature card                                                       */
/* ------------------------------------------------------------------ */
interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    delay: string;
}

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => (
    <div
        className="group relative rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_30px_hsla(190,100%,60%,0.12)] animate-fade-in-up"
        style={{ animationDelay: delay }}
    >
        {/* glow accent */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10">
            <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                {icon}
            </div>
            <h3 className="font-mono text-lg font-bold text-foreground mb-2">{title}</h3>
            <p className="font-mono text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Step card                                                          */
/* ------------------------------------------------------------------ */
interface StepCardProps {
    number: string;
    title: string;
    description: string;
    delay: string;
}

const StepCard = ({ number, title, description, delay }: StepCardProps) => (
    <div
        className="relative text-center animate-fade-in-up"
        style={{ animationDelay: delay }}
    >
        <div className="mx-auto h-16 w-16 rounded-full border-2 border-primary/40 bg-card flex items-center justify-center mb-4 relative">
            <span className="font-mono text-2xl font-bold text-primary">{number}</span>
            <div className="absolute inset-0 rounded-full animate-ping-slow border border-primary/20" />
        </div>
        <h4 className="font-mono text-base font-bold text-foreground mb-2">{title}</h4>
        <p className="font-mono text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Stat item                                                          */
/* ------------------------------------------------------------------ */
interface StatProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    delay: string;
}

const StatItem = ({ icon, label, value, delay }: StatProps) => (
    <div className="text-center animate-fade-in-up" style={{ animationDelay: delay }}>
        <div className="flex items-center justify-center mb-2">{icon}</div>
        <div className="font-mono text-2xl font-bold text-primary mb-1">{value}</div>
        <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{label}</div>
    </div>
);

/* ================================================================== */
/*  LANDING PAGE                                                       */
/* ================================================================== */
const LandingPage = () => {
    const navigate = useNavigate();
    const tagline = "Transform your ideas into professional architectural blueprints in seconds.";
    const { displayed, done } = useTypewriter(tagline, 30);

    return (
        <div className="relative min-h-screen bg-background overflow-x-hidden">
            <BlueprintGrid />
            <Particles />

            {/* -------- HERO -------- */}
            <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
                {/* badge */}
                <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 backdrop-blur-sm">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
                    <span className="font-mono text-xs text-primary tracking-wider">AI-POWERED ARCHITECTURE</span>
                </div>

                {/* logo + name */}
                <div className="animate-fade-in-up flex items-center gap-4 mb-6" style={{ animationDelay: "0.15s" }}>
                    <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_25px_hsla(190,100%,60%,0.15)]">
                        <Cpu className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="font-mono text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight">
                        Archiscan<span className="text-primary">-AI</span>
                    </h1>
                </div>

                {/* typewriter tagline */}
                <p className="font-mono text-base sm:text-lg text-muted-foreground max-w-2xl mb-10 h-14 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                    {displayed}
                    {!done && <span className="inline-block w-[2px] h-5 bg-primary ml-0.5 animate-blink" />}
                </p>

                {/* CTA */}
                <div className="animate-fade-in-up flex flex-col sm:flex-row gap-4" style={{ animationDelay: "0.5s" }}>
                    <Button
                        onClick={() => navigate("/generator")}
                        size="lg"
                        className="relative bg-primary text-primary-foreground font-mono text-base h-14 px-10 rounded-xl hover:shadow-[0_0_40px_hsla(190,100%,60%,0.35)] transition-all duration-300 group"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Generate Blueprint
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                            document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="font-mono text-base h-14 px-8 rounded-xl border-border hover:border-primary/50 hover:text-primary transition-colors"
                    >
                        Learn More
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                {/* scroll hint */}
                <div className="absolute bottom-10 animate-bounce">
                    <ChevronDown className="h-6 w-6 text-muted-foreground" />
                </div>
            </section>

            {/* -------- FEATURES -------- */}
            <section id="features" className="relative z-10 py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="inline-block font-mono text-xs text-primary tracking-widest uppercase mb-3 animate-fade-in-up">
                            Capabilities
                        </span>
                        <h2 className="font-mono text-3xl sm:text-4xl font-bold text-foreground mb-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                            Three Powerful <span className="text-primary">Tools</span>
                        </h2>
                        <p className="font-mono text-sm text-muted-foreground max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                            From text descriptions to image analysis, generate professional floor plans tailored to your exact specifications.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={<PenTool className="h-6 w-6 text-primary" />}
                            title="Text to Blueprint"
                            description="Describe your requirements — room count, plot size, features — and watch AI generate a detailed 2D floor plan blueprint instantly."
                            delay="0.1s"
                        />
                        <FeatureCard
                            icon={<Image className="h-6 w-6 text-primary" />}
                            title="Image to Blueprint"
                            description="Upload a satellite view, sketch, or boundary drawing. AI analyzes the plot shape and generates a floor plan that fits perfectly."
                            delay="0.25s"
                        />
                        <FeatureCard
                            icon={<LayoutGrid className="h-6 w-6 text-primary" />}
                            title="Layout Optimizer"
                            description="Get 3 distinct layout strategies — Compact, Open Plan, and Traditional — each optimized for different architectural goals."
                            delay="0.4s"
                        />
                    </div>
                </div>
            </section>

            {/* -------- HOW IT WORKS -------- */}
            <section className="relative z-10 py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="inline-block font-mono text-xs text-primary tracking-widest uppercase mb-3">
                            Workflow
                        </span>
                        <h2 className="font-mono text-3xl sm:text-4xl font-bold text-foreground mb-4">
                            How It <span className="text-primary">Works</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* connector lines (desktop) */}
                        <div className="hidden md:block absolute top-8 left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-[2px]">
                            <div className="h-full bg-gradient-to-r from-primary/50 via-primary/30 to-primary/50 animate-draw-line" />
                        </div>

                        <StepCard
                            number="01"
                            title="Configure"
                            description="Set your plot size, room count, and optional features like balcony, parking, or garden."
                            delay="0.1s"
                        />
                        <StepCard
                            number="02"
                            title="Generate"
                            description="AI processes your requirements and creates a professional architectural blueprint."
                            delay="0.3s"
                        />
                        <StepCard
                            number="03"
                            title="Download"
                            description="Review, iterate, and download your blueprint. Generate multiple variations effortlessly."
                            delay="0.5s"
                        />
                    </div>
                </div>
            </section>

            {/* -------- STATS -------- */}
            <section className="relative z-10 py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-10">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
                            <StatItem
                                icon={<Sparkles className="h-6 w-6 text-primary" />}
                                value="AI-Powered"
                                label="Generation Engine"
                                delay="0.1s"
                            />
                            <StatItem
                                icon={<Zap className="h-6 w-6 text-primary" />}
                                value="Instant"
                                label="Blueprint Results"
                                delay="0.25s"
                            />
                            <StatItem
                                icon={<Layers className="h-6 w-6 text-primary" />}
                                value="3 Layouts"
                                label="Per Generation"
                                delay="0.4s"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* -------- FOOTER CTA -------- */}
            <section className="relative z-10 py-24 px-6 text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="font-mono text-3xl sm:text-4xl font-bold text-foreground mb-4 animate-fade-in-up">
                        Ready to <span className="text-primary">Build</span>?
                    </h2>
                    <p className="font-mono text-sm text-muted-foreground mb-10 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                        Start generating professional floor plan blueprints right now. No signup required.
                    </p>
                    <Button
                        onClick={() => navigate("/generator")}
                        size="lg"
                        className="relative bg-primary text-primary-foreground font-mono text-base h-14 px-12 rounded-xl hover:shadow-[0_0_40px_hsla(190,100%,60%,0.35)] transition-all duration-300 group animate-fade-in-up"
                        style={{ animationDelay: "0.2s" }}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Start Generating
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Button>
                </div>
            </section>

            {/* -------- FOOTER BAR -------- */}
            <footer className="relative z-10 border-t border-border py-6 px-6">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm text-muted-foreground">Archiscan-AI</span>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground/60">
                        AI-powered architectural blueprint generation
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
