"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "smooth";
    return () => {
      root.style.scrollBehavior = prev;
    };
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.remove("opacity-0", "translate-y-6");
            e.target.classList.add("opacity-100", "translate-y-0");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      {/* HEADER */}
      <header
        className={`sticky top-0 z-40 border-b bg-white/80 backdrop-blur-xl transition-shadow ${
          scrolled ? "shadow-sm" : "shadow-none"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight">
              DHI Creative Services
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a href="#premedia" className="text-slate-700 hover:text-slate-900">
              Premedia Services
            </a>
            <a
              href="#digital-publishing"
              className="text-slate-700 hover:text-slate-900"
            >
              Digital Publishing
            </a>
            <a
              href="#content-creation"
              className="text-slate-700 hover:text-slate-900"
            >
              Content Creation
            </a>
            <a href="#hr" className="text-slate-700 hover:text-slate-900">
              HR Recruitment
            </a>
            <a href="#contact" className="text-slate-700 hover:text-slate-900">
              Contact
            </a>
          </nav>

          <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
            <Link to="/login" className="flex items-center gap-2">
              Employee Login <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_-10%,rgba(37,99,235,0.10),rgba(255,255,255,0))]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div
            data-reveal
            className="opacity-0 translate-y-6 transition-all duration-700"
          >
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Production-ready{" "}
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                Premedia, Publishing & Content
              </span>{" "}
              services.
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              From packaging and artwork to editorial and rich media—we deliver
              pixel-perfect outputs with predictable timelines. HR recruitment
              support included when you need to scale teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#premedia"
                className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Explore Services
              </a>
              <a
                href="#contact"
                className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Contact Us
              </a>
            </div>
            <ul className="mt-8 space-y-2 text-sm text-slate-600">
              {[
                "Specialists in packaging, artworks & 3D",
                "Editorial & alt-text workflows for accessibility",
                "High-impact content for web & social",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Accent card with 4 items (HR last) */}
          <div
            data-reveal
            className="opacity-0 translate-y-6 transition-all duration-700 delay-100"
          >
            <div className="relative rounded-2xl border bg-white p-8 shadow-[0_10px_35px_rgba(2,6,23,0.08)]">
              <div className="absolute -inset-10 -z-10 rounded-[2rem] bg-gradient-to-tr from-blue-100 to-cyan-100 blur-2xl" />
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-600 p-10 text-center text-white">
                <p className="text-lg font-semibold">DHI Creative Services</p>
                <p className="mt-2 text-sm text-white/80">
                  Packaging • Publishing • Content • HR
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs text-slate-600 md:grid-cols-4">
                <div className="rounded-lg border bg-white py-3">
                  <div className="text-sm font-semibold text-slate-900">
                    Premedia
                  </div>
                  <div>Artworks & 3D</div>
                </div>
                <div className="rounded-lg border bg-white py-3">
                  <div className="text-sm font-semibold text-slate-900">
                    Publishing
                  </div>
                  <div>Editorial</div>
                </div>
                <div className="rounded-lg border bg-white py-3">
                  <div className="text-sm font-semibold text-slate-900">
                    Content
                  </div>
                  <div>Digital & Social</div>
                </div>
                <div className="rounded-lg border bg-white py-3">
                  <div className="text-sm font-semibold text-slate-900">HR</div>
                  <div>IT & Non-IT</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREMEDIA SERVICES */}
      <Section
        id="premedia"
        title="Premedia Services"
        subtitle="Packaging, artworks and pixel-perfect production for print & retail."
        items={[
          "Packaging",
          "Die-line creation",
          "Master artwork creation",
          "Range extension & Mechanicals",
          "Repro / Prepress",
          "Image Production",
          "CGI & 3D rendering",
        ]}
        gradient="from-blue-600 via-cyan-600 to-indigo-600"
      />

      {/* DIGITAL PUBLISHING */}
      <Section
        id="digital-publishing"
        title="Digital Publishing"
        subtitle="Accessible, structured content for modern platforms and audiences."
        items={[
          "Data services",
          "Alt-Text Writing",
          "Art & Design services",
          "Illustration / Redrawing services",
          "Editorial services",
        ]}
        gradient="from-cyan-600 to-sky-500"
      />

      {/* CONTENT CREATION */}
      <Section
        id="content-creation"
        title="Content Creation"
        subtitle="Words, visuals, video & audio—consistent brand stories across channels."
        items={[
          "Content writing (Blog posts, articles, website copy, e-books)",
          "Visual content (Infographics, custom graphics, branded images, presentations)",
          "Video content (Promos, explainers, short-form social—Reels/TikToks, animated videos, webinars)",
          "Audio content (Podcast production, voiceovers, audiobooks)",
          "Social Media (Daily posts, captions, stories, polls, quizzes, management)",
          "Translation solutions",
        ]}
        gradient="from-indigo-600 to-fuchsia-600"
      />

      {/* HR RECRUITMENT */}
      <Section
        id="hr"
        title="HR Recruitment"
        subtitle="IT & Non-IT talent pipelines when you need to scale with confidence."
        items={["IT", "Non-IT", "Executive search", "Contract staffing"]}
        gradient="from-slate-700 to-slate-900"
      />

      {/* CONTACT */}
      <section id="contact" className="border-t bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2">
          <div
            data-reveal
            className="opacity-0 translate-y-6 transition-all duration-700"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Contact
            </h2>
            <p className="mt-2 text-slate-600">
              We respond with a clear, scoped plan and timeline.
            </p>

            <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-500">
                Business Enquiries
              </h3>
              <div className="mt-3 space-y-2 text-slate-800">
                <div>
                  <span className="text-slate-500">Phone: </span>
                  <a
                    href="tel:+918056092982"
                    className="font-medium text-slate-900 hover:underline"
                  >
                    +91 8056092982
                  </a>
                </div>
                <div className="text-sm leading-relaxed">
                  The WorkVilla, Arcade Centre, 3rd Floor, 110/1, Mahatma Gandhi
                  Road, Nungambakkam, Chennai 600034.
                </div>
              </div>
            </div>
          </div>

          <div
            data-reveal
            className="opacity-0 translate-y-6 transition-all duration-700 delay-100"
          >
            <div className="overflow-hidden rounded-2xl border shadow-sm">
              <iframe
                title="DHI Creative Services — Location"
                width="100%"
                height="360"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=The%20WorkVilla%2C%20Arcade%20Centre%2C%20110%2F1%20Mahatma%20Gandhi%20Road%2C%20Nungambakkam%2C%20Chennai%20600034&output=embed"
              />
            </div>
          </div>
        </div>

        <footer className="border-t">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-slate-600 md:flex-row">
            <div>© {new Date().getFullYear()} DHI Creative Services</div>
            <div className="flex items-center gap-5">
              <a href="#premedia" className="hover:text-slate-900">
                Premedia
              </a>
              <a href="#digital-publishing" className="hover:text-slate-900">
                Digital Publishing
              </a>
              <a href="#content-creation" className="hover:text-slate-900">
                Content
              </a>
              <a href="#hr" className="hover:text-slate-900">
                HR
              </a>
              <a href="#contact" className="hover:text-slate-900">
                Contact
              </a>
              <Link to="/login" className="hover:text-slate-900">
                Employee Login
              </Link>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}

/* ---------- Section helper ---------- */

function Section({
  id,
  title,
  subtitle,
  items,
  gradient,
}: {
  id: string;
  title: string;
  subtitle: string;
  items: string[];
  gradient: string;
}) {
  return (
    <section id={id} className="border-t">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div
          data-reveal
          className="opacity-0 translate-y-6 transition-all duration-700"
        >
          <div
            className={`inline-flex items-center rounded-full bg-gradient-to-r ${gradient} px-3 py-1 text-xs font-semibold text-white`}
          >
            {title}
          </div>
          <div className="mt-4 grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {title}
              </h2>
              <p className="mt-3 max-w-prose text-slate-600">{subtitle}</p>
            </div>
            <ul className="grid gap-3">
              {items.map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span className="text-slate-800">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
