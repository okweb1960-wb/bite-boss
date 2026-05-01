import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1 — Acceptance of Terms",
    content: "By accessing or using Bite Boss (bitebossapp.com), you agree to be bound by these Terms of Service. If you do not agree, please do not use the app."
  },
  {
    title: "2 — Description of Service",
    content: "Bite Boss is a free restaurant discovery application that helps users find and select nearby restaurants using a swipe-based interface. The service uses Google Places API to retrieve restaurant data."
  },
  {
    title: "3 — Intellectual Property",
    content: "Bite Boss, including its name, logo, design, code, and all content, is the exclusive property of Martin Webster and is protected by United States copyright law and applicable international treaties.",
    bullets: [
      "Copy, reproduce, or duplicate any part of the app",
      "Reverse engineer or attempt to extract the source code",
      "Use the Bite Boss name or branding without written permission",
      "Create derivative works based on Bite Boss without written permission",
    ],
    bulletsPrefix: "You may not:"
  },
  {
    title: "4 — User Conduct",
    content: "You agree to use Bite Boss only for lawful purposes and in a way that does not infringe the rights of others. You agree not to attempt to gain unauthorized access to any part of the service or its related systems."
  },
  {
    title: "5 — Third Party Services",
    content: "Bite Boss uses Google Places API to provide restaurant data. Restaurant information including names, addresses, ratings, photos, and hours is provided by Google and may not always be accurate or up to date. Bite Boss is not responsible for the accuracy of third party data."
  },
  {
    title: "6 — Location Data",
    content: "Bite Boss requests access to your device location solely to find restaurants near you. Location data is used in real time and is not stored on our servers."
  },
  {
    title: "7 — Disclaimer of Warranties",
    content: 'Bite Boss is provided "as is" without warranty of any kind, express or implied. We do not guarantee that the service will be uninterrupted, error free, or that restaurant information will be accurate or complete.'
  },
  {
    title: "8 — Limitation of Liability",
    content: "To the maximum extent permitted by law, Martin Webster shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of Bite Boss, including but not limited to reliance on restaurant information provided by the app."
  },
  {
    title: "9 — Changes to Terms",
    content: "We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms."
  },
  {
    title: "10 — Governing Law",
    content: "These terms are governed by the laws of the State of Nebraska, United States, without regard to conflict of law principles."
  },
  {
    title: "11 — Contact",
    content: "For questions about these terms, contact us at:",
    contact: "support@bitebossapp.com"
  },
];

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full bg-teal-50 hover:bg-teal-100 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-teal-600" />
        </button>
        <h1 className="font-bold text-foreground text-lg">Terms of Service</h1>
      </div>

      {/* Content */}
      <div className="px-5 py-6 max-w-2xl mx-auto space-y-6 pb-12">
        <p className="text-sm text-muted-foreground">Last updated: May 1, 2025</p>

        {sections.map((s) => (
          <div key={s.title}>
            <h2 className="font-black text-teal-700 text-base mb-2">Section {s.title}</h2>
            <p className="text-sm text-foreground leading-relaxed">{s.content}</p>
            {s.bulletsPrefix && (
              <p className="text-sm text-foreground mt-2 mb-1 font-semibold">{s.bulletsPrefix}</p>
            )}
            {s.bullets && (
              <ul className="space-y-1 mt-1">
                {s.bullets.map((b) => (
                  <li key={b} className="text-sm text-foreground flex gap-2">
                    <span className="text-orange-500 font-bold shrink-0">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            {s.contact && (
              <a
                href={`mailto:${s.contact}`}
                className="text-sm text-teal-600 font-semibold hover:underline mt-1 block"
              >
                {s.contact}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}