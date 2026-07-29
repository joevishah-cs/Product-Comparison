import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, ShieldCheck, BarChart3, FileSearch, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth, DEMO_EMAIL, DEMO_PASSWORD } from "./AuthProvider";
import { PRODUCTS, SOURCE_DOCUMENTS } from "@/data/catalog";

const HIGHLIGHTS = [
  {
    icon: FileSearch,
    title: "Every value traced to a cell",
    body: `${PRODUCTS.length} products imported from ${SOURCE_DOCUMENTS.length} source documents, each attribute carrying its page, sheet and cell of origin.`,
  },
  {
    icon: BarChart3,
    title: "Comparison you can project",
    body: "Large-type charts, plain-language explanations and printable evidence built for the room, not the spreadsheet.",
  },
  {
    icon: ShieldCheck,
    title: "Claims that survive scrutiny",
    body: "Advantages are calculated from source values only. A blank cell is never read as a “No”.",
  },
];

export function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [forgotOpen, setForgotOpen] = React.useState(false);

  React.useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  async function submit(e: React.FormEvent, demo = false) {
    e.preventDefault();
    setError(null);

    const emailValue = demo ? DEMO_EMAIL : email;
    const passwordValue = demo ? DEMO_PASSWORD : password;

    if (!emailValue.trim()) return setError("Enter your work email address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim()))
      return setError("That does not look like a valid email address.");
    if (!passwordValue) return setError("Enter your password.");

    setBusy(true);
    const { error: signInError } = await signIn(emailValue, passwordValue, remember);
    setBusy(false);

    if (signInError) setError(signInError);
    else navigate("/dashboard", { replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-navy-900 px-10 py-14 lg:flex lg:flex-col xl:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(1100px 620px at 12% -8%, rgba(0,151,224,0.55), transparent 62%), radial-gradient(820px 520px at 96% 104%, rgba(89,188,255,0.32), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative z-10 flex h-full flex-col">
          <img src="/brand/daikin-logo.png" alt="Daikin" className="h-9 w-auto brightness-0 invert" />

          <div className="mt-auto max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-daikin-300">
              Daikin Competitive Marketing Intelligence
            </p>
            <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.12] text-white xl:text-5xl">
              Turn verified product intelligence into market momentum.
            </h1>
            <p className="mt-5 text-xl font-medium text-daikin-200">Compare. Position. Win.</p>

            <ul className="mt-10 space-y-4">
              {HIGHLIGHTS.map((h) => (
                <li key={h.title} className="flex gap-4 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-inset ring-white/10">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-daikin-200">
                    <h.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-white">{h.title}</p>
                    <p className="mt-0.5 text-[0.9375rem] leading-relaxed text-navy-200">{h.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <img
              src="/products/sd-daikin.svg"
              alt="Representative illustration of a side-discharge inverter outdoor unit"
              className="h-20 w-28 rounded-xl object-cover ring-1 ring-white/15"
            />
            <img
              src="/products/atw-daikin.svg"
              alt="Representative illustration of an air-to-water heat pump"
              className="h-20 w-28 rounded-xl object-cover ring-1 ring-white/15"
            />
            <p className="text-sm leading-relaxed text-navy-300">
              Representative equipment illustrations.
              <br />
              Imported sources contain no manufacturer photography.
            </p>
          </div>
        </div>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center bg-white px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <img src="/brand/daikin-logo.png" alt="Daikin" className="mb-8 h-8 w-auto lg:hidden" />

          <h2 className="text-3xl font-bold text-navy-900">Sign in</h2>
          <p className="mt-2 text-base text-navy-500">
            Access the competitive intelligence workspace for Daikin sales and product marketing.
          </p>

          <form className="mt-8 space-y-5" onSubmit={(e) => submit(e)} noValidate>
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-risk-500/25 bg-risk-50 px-4 py-3">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-risk-600" aria-hidden />
                <p className="text-sm font-medium text-risk-700">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@daikin.com"
                aria-invalid={Boolean(error)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(error)}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-700"
                >
                  {showPassword ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                  aria-label="Remember me on this device"
                />
                <span className="text-sm font-medium text-navy-700">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="min-h-[44px] text-sm font-semibold text-daikin-700 hover:text-daikin-800 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              Sign in
            </Button>

            <div className="relative py-1">
              <span className="absolute inset-x-0 top-1/2 h-px bg-edge" aria-hidden />
              <span className="relative mx-auto block w-fit bg-white px-3 text-sm text-navy-400">or</span>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              disabled={busy}
              onClick={(e) => void submit(e, true)}
            >
              Use competition demo
            </Button>
          </form>

          <div className={cn("mt-8 rounded-xl border border-edge bg-navy-50/70 p-4")}>
            <p className="text-xs font-bold uppercase tracking-wider text-navy-400">Demo credentials</p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-navy-500">Email</dt>
              <dd className="font-mono font-medium text-navy-800">{DEMO_EMAIL}</dd>
              <dt className="text-navy-500">Password</dt>
              <dd className="font-mono font-medium text-navy-800">{DEMO_PASSWORD}</dd>
            </dl>
          </div>
        </div>
      </section>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription>
            Password resets for the competitive intelligence workspace are handled by Daikin IT through
            your normal single sign-on support channel. This demo environment does not send email.
          </DialogDescription>
          <p className="mt-4 rounded-xl bg-navy-50 p-4 text-sm text-navy-600">
            To explore the application now, use <strong>Use competition demo</strong> on the sign-in form.
          </p>
          <div className="mt-5 flex justify-end">
            <Button onClick={() => setForgotOpen(false)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
