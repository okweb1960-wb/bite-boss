import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "Introduction",
    isIntro: true,
    content: 'Bite Boss ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect information when you use Bite Boss at bitebossapp.com.'
  },
  {
    title: "1 — Information We Collect",
    subsections: [
      {
        label: "A) Location Information",
        content: "When you use Bite Boss, we request access to your device's location to find restaurants near you. Your location is used only in real time to make API requests to Google Places. We do not store your location data on our servers."
      },
      {
        label: "B) Usage Data",
        content: "We collect anonymous usage data to understand how people use the app. This may include:",
        bullets: [
          "Pages visited within the app",
          "Features used (filters, swipes, Pick For Me)",
          "Session duration",
          "Device type and browser",
          "General geographic region",
        ],
        note: "This data is collected through Google Analytics and does not personally identify you."
      },
      {
        label: "C) Information You Provide",
        content: "Bite Boss does not require account creation or personal information to use. We do not collect your name, email address, or any other personal information unless you contact us directly at support@bitebossapp.com."
      },
    ]
  },
  {
    title: "2 — How We Use Information",
    content: "We use the information we collect to:",
    bullets: [
      "Provide restaurant recommendations near your location",
      "Improve the app experience",
      "Understand usage patterns and popular features",
      "Fix bugs and technical issues",
    ]
  },
  {
    title: "3 — Third Party Services",
    subsections: [
      {
        label: "Google Places API",
        content: "Restaurant data including names, addresses, photos, ratings, and hours is provided by Google Places API. Your location coordinates are sent to Google to retrieve nearby restaurants. Google's privacy policy applies to this data transfer and can be found at ",
        link: { text: "policies.google.com/privacy", href: "https://policies.google.com/privacy" }
      },
      {
        label: "Google Analytics",
        content: "We use Google Analytics to collect anonymous usage statistics. Google Analytics uses cookies and similar technologies. You can opt out of Google Analytics tracking at ",
        link: { text: "tools.google.com/dlpage/gaoptout", href: "https://tools.google.com/dlpage/gaoptout" }
      },
    ]
  },
  {
    title: "4 — Cookies",
    content: "Bite Boss uses minimal cookies necessary for the app to function. We do not use advertising cookies or track you across other websites."
  },
  {
    title: "5 — Data Sharing",
    content: "We do not sell, trade, or rent your personal information to third parties. We do not share your data with anyone except as required to operate the service (Google Places API, Google Analytics)."
  },
  {
    title: "6 — Data Retention",
    content: "Since we do not collect personal information, there is no personal data to retain or delete. Anonymous usage statistics are retained by Google Analytics per their standard retention policies."
  },
  {
    title: "7 — Children's Privacy",
    content: "Bite Boss is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13."
  },
  {
    title: "8 — Your Rights",
    content: "Since we do not collect personal information, there is no personal data to access, correct, or delete. If you have concerns about your privacy while using Bite Boss, contact us at support@bitebossapp.com."
  },
  {
    title: "9 — California Residents",
    content: "If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA). Since Bite Boss does not sell personal information and does not collect personal information beyond anonymous usage data, most CCPA provisions do not apply. For questions contact support@bitebossapp.com."
  },
  {
    title: "10 — International Users",
    content: "Bite Boss is operated from the United States. If you are located outside the United States, please be aware that your information may be transferred to and processed in the United States."
  },
  {
    title: "11 — Changes to This Policy",
    content: 'We may update this Privacy Policy from time to time. We will post the updated policy on this page with a new "Last updated" date.'
  },
  {
    title: "12 — Contact Us",
    content: "If you have questions about this Privacy Policy, please contact us:",
    contacts: [
      { label: "Email:", value: "support@bitebossapp.com", href: "mailto:support@bitebossapp.com" },
      { label: "Website:", value: "bitebossapp.com", href: "https://bitebossapp.com" },
    ]
  },
];

export default function Privacy() {
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
        <h1 className="font-bold text-foreground text-lg">Privacy Policy</h1>
      </div>

      {/* Content */}
      <div className="px-5 py-6 max-w-2xl mx-auto space-y-6 pb-12">
        <p className="text-sm text-muted-foreground">Last updated: May 1, 2025</p>

        {sections.map((s) => (
          <div key={s.title}>
            {s.isIntro ? (
              <>
                <h2 className="font-black text-teal-700 text-base mb-2">{s.title}</h2>
                <p className="text-sm text-foreground leading-relaxed">{s.content}</p>
              </>
            ) : (
              <>
                <h2 className="font-black text-teal-700 text-base mb-2">Section {s.title}</h2>
                {s.content && (
                  <p className="text-sm text-foreground leading-relaxed">{s.content}</p>
                )}
                {s.bullets && (
                  <ul className="space-y-1 mt-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="text-sm text-foreground flex gap-2">
                        <span className="text-orange-500 font-bold shrink-0">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {s.subsections && (
                  <div className="space-y-4 mt-2">
                    {s.subsections.map((sub) => (
                      <div key={sub.label}>
                        <p className="text-sm font-bold text-foreground mb-1">{sub.label}</p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {sub.content}
                          {sub.link && (
                            <a
                              href={sub.link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-600 hover:underline"
                            >
                              {sub.link.text}
                            </a>
                          )}
                        </p>
                        {sub.bullets && (
                          <ul className="space-y-1 mt-2">
                            {sub.bullets.map((b) => (
                              <li key={b} className="text-sm text-foreground flex gap-2">
                                <span className="text-orange-500 font-bold shrink-0">•</span>
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {sub.note && (
                          <p className="text-sm text-muted-foreground mt-2 italic">{sub.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {s.contacts && (
                  <div className="mt-2 space-y-1">
                    {s.contacts.map((c) => (
                      <p key={c.label} className="text-sm text-foreground">
                        <span className="font-semibold">{c.label} </span>
                        <a href={c.href} className="text-teal-600 hover:underline">{c.value}</a>
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}