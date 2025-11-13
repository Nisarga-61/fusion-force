"use client";
import Link from "next/link";
import WalletConnector from "@/components/WalletConnector";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import PasswordStrength from "@/components/PasswordStrength";

const usernameRe = /^[A-Za-z0-9]{3,20}$/;
const passwordRe = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const Schema = z.object({
  username: z.string().regex(usernameRe, "3-20 alphanumeric"),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().regex(passwordRe, "Min 8, 1 upper, 1 number, 1 special"),
});

type FormValues = z.infer<typeof Schema>;

export default function Page() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(Schema) });
  const pwd = watch("password") || "";

  const onRegister = async (values: FormValues) => {
    const res = await fetch("/api/auth/register/strict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Registration failed");
    alert("Registered. You can login now.");
  };

  const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = String(form.get("l_username") || "");
    const password = String(form.get("l_password") || "");
    const res = await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    const data = await res.json();
    if (!res.ok) return alert("Invalid credentials");
    sessionStorage.setItem("access", data.access);
    alert("Logged in");
    window.location.href = "/biometric";
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 bg-black text-white min-h-screen">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-pink-400">VERIFY EVERYTHING REVEAL NOTHING</h1>
        <WalletConnector />
      </header>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <form aria-label="Register" onSubmit={handleSubmit(onRegister)} className="rounded-xl border border-pink-700/40 bg-zinc-950 p-5 shadow-[0_0_30px_-10px_rgba(236,72,153,0.5)]">
          <h2 className="text-lg font-medium text-pink-300">Create account</h2>
          <label className="mt-3 block text-sm">Username
            <input aria-invalid={!!errors.username} className="mt-1 w-full rounded-md border border-pink-700 bg-black px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500" {...register("username")} placeholder="e.g. alice42" />
            {errors.username && <span className="text-xs text-pink-400">{errors.username.message}</span>}
          </label>
          <label className="mt-3 block text-sm">Email (optional)
            <input className="mt-1 w-full rounded-md border border-pink-700 bg-black px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500" {...register("email")} placeholder="name@example.com" />
          </label>
          <label className="mt-3 block text-sm">Password
            <input aria-invalid={!!errors.password} type="password" className="mt-1 w-full rounded-md border border-pink-700 bg-black px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500" {...register("password")} placeholder="Min 8, Upper, Number, Special" />
            <PasswordStrength value={pwd} />
            {errors.password && <span className="text-xs text-pink-400">{errors.password.message}</span>}
          </label>
          <button type="submit" className="mt-4 w-full rounded-md bg-pink-600 px-3 py-2 font-medium text-black hover:bg-pink-500">Register</button>
        </form>
        <form aria-label="Login" onSubmit={onLogin} className="rounded-xl border border-pink-700/40 bg-zinc-950 p-5 shadow-[0_0_30px_-10px_rgba(236,72,153,0.5)]">
          <h2 className="text-lg font-medium text-pink-300">Login</h2>
          <label className="mt-3 block text-sm">Username
            <input name="l_username" className="mt-1 w-full rounded-md border border-pink-700 bg-black px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500" placeholder="your username" />
          </label>
          <label className="mt-3 block text-sm">Password
            <input name="l_password" type="password" className="mt-1 w-full rounded-md border border-pink-700 bg-black px-3 py-2 outline-none focus:ring-2 focus:ring-pink-500" placeholder="••••••••" />
          </label>
          <button type="submit" className="mt-4 w-full rounded-md bg-pink-600 px-3 py-2 font-medium text-black hover:bg-pink-500">Login</button>
          <div className="mt-4 space-y-2 text-sm">
            <Link href="/biometric" className="text-pink-300 underline">Retinal biometric</Link>
            <div className="text-zinc-400">ZKP: <Link href="/zkp" className="text-pink-300 underline">Challenge-Response</Link></div>
          </div>
        </form>
      </div>
    </div>
  );
}
