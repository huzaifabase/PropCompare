"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newsletterSchema, contactSchema } from "@/lib/validators";
import { Button, Input, Textarea, Field, Alert } from "./ui";

type NewsletterValues = { email: string; consent: boolean };

export function NewsletterFormClient() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NewsletterValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { consent: false },
  });

  async function onSubmit(values: NewsletterValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      setDone(true);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  if (done) return <Alert tone="success">You&apos;re subscribed. Watch your inbox for verified discount alerts.</Alert>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row" noValidate>
      <div className="flex-1">
        <label htmlFor="nl-email" className="sr-only">Email address</label>
        <Input id="nl-email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
        {errors.email && <p className="mt-1 text-left text-xs text-red-300" role="alert">{errors.email.message}</p>}
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-300">
        <input type="checkbox" {...register("consent")} className="h-4 w-4 accent-[#10B981]" /> I agree to receive emails
      </label>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Subscribing…" : "Subscribe"}</Button>
      {serverError && <p className="text-xs text-red-300" role="alert">{serverError}</p>}
      {errors.consent && <p className="text-xs text-red-300" role="alert">Please tick the consent box.</p>}
    </form>
  );
}

type ContactValues = { name: string; email: string; subject: string; message: string; website?: string };

export function ContactFormClient() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(values: ContactValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      setDone(true);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  if (done) return <Alert tone="success">Thanks — your message was received. We&apos;ll reply if a response is needed.</Alert>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* honeypot */}
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden {...register("website")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="c-name" error={errors.name?.message}>
          <Input id="c-name" autoComplete="name" {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="c-email" error={errors.email?.message}>
          <Input id="c-email" type="email" autoComplete="email" {...register("email")} />
        </Field>
      </div>
      <Field label="Subject" htmlFor="c-subject" error={errors.subject?.message}>
        <Input id="c-subject" {...register("subject")} />
      </Field>
      <Field label="Message" htmlFor="c-message" error={errors.message?.message}>
        <Textarea id="c-message" rows={6} {...register("message")} />
      </Field>
      {serverError && <Alert tone="error">{serverError}</Alert>}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send message"}</Button>
    </form>
  );
}
