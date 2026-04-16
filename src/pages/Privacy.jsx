import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Scale } from "lucide-react";

const LAST_UPDATED = "April 14, 2026";

function SummarizedPrivacy() {
  return (
    <div style={{ padding: "20px 20px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          background: "var(--green-bg)",
          border: "1px solid var(--green-bd)",
          borderRadius: "var(--rlg)",
          padding: "14px 16px",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--green-text)", marginBottom: 4 }}>
          The TL;DR
        </div>
        <div style={{ fontSize: 13, color: "var(--green-text)", lineHeight: 1.6 }}>
          We're not here to sell your data or be creepy about it. Here's the real breakdown of what we collect, why, and what we do (and don't do) with it.
        </div>
      </div>

      <Section title="What we collect">
        <P>Literally just what we need to make the app work:</P>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4, marginBottom: 6 }}>
          <LI>
            Your <strong>@nmsu.edu email</strong> (Main Campus in Las Cruces only — exactly <strong>@nmsu.edu</strong>, not
            extension domains like <strong>@dacc.nmsu.edu</strong> or <strong>@global.nmsu.edu</strong>) — this is your
            login. It&apos;s how we verify you&apos;re an eligible Main Campus student.
          </LI>
          <LI>Your <strong>name</strong> — first and last, so people know who they're working with.</LI>
          <LI>Your <strong>gig activity</strong> — what you post, what you accept, whether you completed it.</LI>
          <LI>Your <strong>reviews and reputation score</strong> — these are public on the platform anyway.</LI>
          <LI>Your <strong>profile info</strong> — bio, avatar color, major, etc. Whatever you choose to add.</LI>
          <LI>
            Optional <strong>transactional email</strong> to your @nmsu.edu — only if you enable email alerts in Settings (gig/review notices), never sold or used for ads.
          </LI>
        </ul>
        <P>That's it. We don't track your location, we don't read your texts, we don't follow you around the internet.</P>
      </Section>

      <Section title="How we store it">
        <P>All your data lives in <strong>Supabase</strong>, which is a secure, hosted database platform. It's encrypted and access-controlled. We use industry-standard security practices to keep your information safe.</P>
        <P>The app itself is hosted on <strong>Vercel</strong>. Neither Supabase nor Vercel sells your data — they're infrastructure providers, not ad companies.</P>
      </Section>

      <Section title="We do NOT sell your data">
        <P>Period. Full stop. No negotiations. Your data is not for sale. Not to advertisers, not to businesses in the Deals tab, not to NMSU, not to anyone. The businesses that post deals on our platform never see your email, your name, or anything about you.</P>
      </Section>

      <Section title="FERPA — we got you">
        <P>We know your @nmsu.edu email is connected to your student status, and that means <strong>FERPA</strong> (Family Educational Rights and Privacy Act) is relevant. Here's the deal:</P>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4, marginBottom: 6 }}>
          <LI>We don't access or store your academic records. At all.</LI>
          <LI>We don't share your .edu email with third parties.</LI>
          <LI>
            We use your email for sign-in and, if you keep email alerts on in Settings, for transactional messages about gigs and reviews — not marketing spam.
          </LI>
        </ul>
        <P>We're not part of NMSU's systems and we don't have access to anything in your student portal. Your GPA is safe with us (mainly because we don't have it).</P>
      </Section>

      <Section title="Cookies & analytics">
        <P>We use basic analytics (Vercel Speed Insights) to understand how the app performs — like load times and stuff. This isn't tracking you personally. We don't use advertising cookies or third-party trackers.</P>
      </Section>

      <Section title="Want your data deleted?">
        <P>
          You can start account deletion in <strong>Settings</strong>. During the grace period you can cancel:{" "}
          <strong>this will sign you out</strong>; after you sign in again with your @nmsu.edu, a fresh sign-in clears the
          scheduled deletion. You
          can also email <strong>support@getcampusgig.com</strong> for help. After the grace period we remove your profile,
          gig history, reviews, rep, and related data.
        </P>
        <P>Heads up: once it's deleted, it's deleted. We can't get it back for you.</P>
      </Section>

      <Section title="Changes to this policy">
        <P>If we update this privacy policy, we'll let you know. We're not going to quietly change things and hope nobody notices. That's shady and we're not about that.</P>
      </Section>

      <div style={{ fontSize: 12, color: "var(--fg4)", fontFamily: "var(--mono)", textAlign: "center", marginTop: 8 }}>
        Last updated: {LAST_UPDATED}
      </div>
    </div>
  );
}

function LegalPrivacy() {
  return (
    <div style={{ padding: "20px 20px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)", lineHeight: 1.6 }}>
        Effective Date: {LAST_UPDATED}
      </div>

      <LegalSection num="1" title="Introduction">
        <LP>GetCampusGig ("we," "us," "our") operates the website getcampusgig.com and related services (collectively, the "Platform"). This Privacy Policy describes how we collect, use, store, and protect your personal information when you use the Platform.</LP>
        <LP>By creating an account or using the Platform, you consent to the data practices described in this Privacy Policy.</LP>
      </LegalSection>

      <LegalSection num="2" title="Information We Collect">
        <LP><strong>2.1 Information You Provide</strong></LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
          <LI>
            <strong>Email Address:</strong> Your Main Campus <strong>@nmsu.edu</strong> email address (domain exactly{" "}
            <code>nmsu.edu</code> — not subdomains such as <code>dacc.nmsu.edu</code>, <code>alamogordo.nmsu.edu</code>,{" "}
            <code>grants.nmsu.edu</code>, or <code>global.nmsu.edu</code>), used for account authentication via magic link.
          </LI>
          <LI><strong>Name:</strong> First and last name, provided during account registration.</LI>
          <LI><strong>Profile Information:</strong> Optional details such as biography, major, graduation year, avatar preferences, and payment handle (e.g., Cash App, Venmo, or PayPal username).</LI>
        </ul>
        <LP><strong>2.2 Information Generated Through Use</strong></LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
          <LI><strong>Gig Activity:</strong> Records of gigs posted, accepted, completed, and cancelled.</LI>
          <LI><strong>Reviews and Ratings:</strong> Text reviews and star ratings submitted by and about you.</LI>
          <LI><strong>Reputation Score:</strong> A calculated score based on your gig activity and reviews.</LI>
          <LI><strong>Notification Data:</strong> Records of in-app notifications and read status.</LI>
        </ul>
        <LP><strong>2.3 Automatically Collected Information</strong></LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI><strong>Performance Analytics:</strong> We use Vercel Speed Insights to collect anonymized performance metrics (page load times, web vitals). This data is not personally identifiable.</LI>
          <LI><strong>Authentication Tokens:</strong> Session tokens managed by Supabase for maintaining your logged-in state.</LI>
        </ul>
      </LegalSection>

      <LegalSection num="3" title="How We Use Your Information">
        <LP>We use collected information for the following purposes:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>To authenticate your identity and verify NMSU enrollment.</LI>
          <LI>To facilitate the creation, browsing, and management of gig listings.</LI>
          <LI>To display your public profile, reviews, and reputation to other Users.</LI>
          <LI>To populate the leaderboard with reputation rankings.</LI>
          <LI>To send in-app notifications regarding gig updates, reviews, and account activity.</LI>
          <LI>
            To send optional transactional email to your @nmsu.edu address when you enable email alerts in Settings (e.g., gig requests and reviews). You can turn this off anytime in Settings.
          </LI>
          <LI>To monitor and improve Platform performance and reliability.</LI>
          <LI>To enforce our Terms of Service and protect Platform integrity.</LI>
        </ul>
      </LegalSection>

      <LegalSection num="4" title="Data Storage and Security">
        <LP>Your data is stored in <strong>Supabase</strong>, a cloud-hosted PostgreSQL database platform that employs encryption at rest and in transit, row-level security policies, and access controls.</LP>
        <LP>The Platform frontend is hosted on <strong>Vercel</strong>. Both Supabase and Vercel maintain SOC 2 compliance and implement industry-standard security measures.</LP>
        <LP>While we implement reasonable security measures to protect your information, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security of your data.</LP>
      </LegalSection>

      <LegalSection num="5" title="Data Sharing and Disclosure">
        <LP><strong>We do not sell, rent, trade, or otherwise disclose your personal information to third parties for marketing or advertising purposes.</strong></LP>
        <LP>We may share information only in the following limited circumstances:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI><strong>Public Profile Data:</strong> Your name, reputation score, reviews, and gig history are visible to other authenticated Users of the Platform as part of core functionality.</LI>
          <LI><strong>Service Providers:</strong> We use Supabase (database/authentication) and Vercel (hosting/analytics) as infrastructure providers. These providers process data on our behalf and are contractually obligated to protect it.</LI>
          <LI><strong>Legal Compliance:</strong> We may disclose information if required by law, court order, or governmental request, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.</LI>
        </ul>
        <LP><strong>Deals Tab Advertisers:</strong> Businesses featured in the Deals section do not receive any User data. Advertising relationships are limited to content display only.</LP>
      </LegalSection>

      <LegalSection num="6" title="FERPA Compliance">
        <LP>
          We recognize that @nmsu.edu email addresses used for Main Campus (Las Cruces) students are associated with
          student status at New Mexico State University, and that student information may be subject to the Family
          Educational Rights and Privacy Act (FERPA). We intentionally restrict authentication to the Main Campus @nmsu.edu
          domain and do not accept separate NMSU extension-campus email domains.
        </LP>
        <LP>GetCampusGig affirms the following:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>We do not access, collect, or store any educational records maintained by NMSU.</LI>
          <LI>We do not have access to academic transcripts, grades, enrollment details, financial aid information, or any data maintained in NMSU's student information systems.</LI>
          <LI>The @nmsu.edu email is used solely for identity verification and authentication purposes.</LI>
          <LI>We do not share @nmsu.edu email addresses with third parties.</LI>
          <LI>We are not a school official or institutional affiliate of NMSU and do not operate under any data-sharing agreement with the university.</LI>
        </ul>
      </LegalSection>

      <LegalSection num="7" title="Data Retention">
        <LP>We retain your personal information for as long as your account is active or as needed to provide you with the Platform's services. Upon account deletion, we will remove your data from our active systems within thirty (30) days, subject to the following exceptions:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>Data required to be retained for legal or regulatory compliance.</LI>
          <LI>Anonymized or aggregated data that cannot be used to identify you.</LI>
          <LI>Backup copies that are automatically purged according to our retention schedule.</LI>
        </ul>
      </LegalSection>

      <LegalSection num="8" title="User Rights and Data Deletion">
        <LP>You have the right to:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
          <LI><strong>Access:</strong> Request a copy of the personal information we hold about you.</LI>
          <LI><strong>Correction:</strong> Request correction of inaccurate personal information.</LI>
          <LI><strong>Deletion:</strong> Request deletion of your account and all associated personal data.</LI>
          <LI><strong>Portability:</strong> Request your data in a structured, commonly used format.</LI>
        </ul>
        <LP>To exercise any of these rights, contact us at <strong>support@getcampusgig.com</strong>. We will respond to verified requests within thirty (30) days.</LP>
      </LegalSection>

      <LegalSection num="9" title="Children's Privacy">
        <LP>The Platform is not intended for use by individuals under the age of thirteen (13). We do not knowingly collect personal information from children under 13. If we become aware that we have collected data from a child under 13, we will promptly delete such information.</LP>
      </LegalSection>

      <LegalSection num="10" title="Third-Party Links">
        <LP>The Platform may contain links to third-party websites or services (including payment platforms referenced in gig listings). We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party services you interact with.</LP>
      </LegalSection>

      <LegalSection num="11" title="Changes to This Privacy Policy">
        <LP>We may update this Privacy Policy from time to time. Material changes will be communicated through the Platform. Your continued use of the Platform after any modifications constitutes acceptance of the updated Privacy Policy.</LP>
      </LegalSection>

      <LegalSection num="12" title="Contact Information">
        <LP>For questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:</LP>
        <LP><strong>Email:</strong> support@getcampusgig.com</LP>
        <LP><strong>Website:</strong> getcampusgig.com</LP>
      </LegalSection>

      <div style={{ fontSize: 12, color: "var(--fg4)", fontFamily: "var(--mono)", textAlign: "center", marginTop: 8 }}>
        Last updated: {LAST_UPDATED}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

function P({ children }) {
  return <div style={{ fontSize: 13, color: "var(--fg2)", lineHeight: 1.7, marginBottom: 6 }}>{children}</div>;
}

function LI({ children }) {
  return <li style={{ fontSize: 13, color: "var(--fg2)", lineHeight: 1.7 }}>{children}</li>;
}

function LegalSection({ num, title, children }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 6 }}>
        {num}. {title}
      </div>
      {children}
    </div>
  );
}

function LP({ children }) {
  return <div style={{ fontSize: 13, color: "var(--fg2)", lineHeight: 1.7, marginBottom: 8 }}>{children}</div>;
}

export default function Privacy() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("summary");

  return (
    <div className="page fadein">
      <div style={{ padding: "16px 20px 0", borderBottom: "1px solid var(--bd)" }}>
        <button
          className="btn bg-btn"
          style={{ padding: 0, gap: 4, marginBottom: 16 }}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={13} /> Back
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.035em", marginBottom: 2 }}>
          Privacy Policy
        </div>
        <div style={{ fontSize: 13, color: "var(--fg3)", marginBottom: 12 }}>
          GetCampusGig — getcampusgig.com
        </div>
        <div style={{ display: "flex", borderBottom: "none" }}>
          <button
            className={`ptab${tab === "summary" ? " on" : ""}`}
            onClick={() => setTab("summary")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
          >
            <FileText size={13} /> Summary
          </button>
          <button
            className={`ptab${tab === "legal" ? " on" : ""}`}
            onClick={() => setTab("legal")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
          >
            <Scale size={13} /> Full Legal
          </button>
        </div>
      </div>

      <div className="scroll">
        {tab === "summary" ? <SummarizedPrivacy /> : <LegalPrivacy />}
      </div>
    </div>
  );
}
