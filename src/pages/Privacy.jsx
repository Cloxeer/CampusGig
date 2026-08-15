import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Scale } from "lucide-react";
import { COMMUNITY_DISCORD_INVITE_URL, DISCORD_SUPPORT_USERNAME } from "../utils/supportCommunity";

const LAST_UPDATED = "August 14, 2026";

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
          We're not here to sell your data or be creepy about it. Here's the real breakdown of what we collect, why, who
          can see what, and what we do (and don't do) with it.
        </div>
      </div>

      <Section title="Two kinds of accounts">
        <P>
          <strong>Students</strong> sign in with a Main Campus <strong>@nmsu.edu</strong> email (magic link). That's how
          we verify you're an eligible NMSU Main Campus student — only verified students can take on gigs.
        </P>
        <P>
          <strong>Clients</strong> (anyone else who wants to post work for students) sign up with any email address and a
          password. Clients can post gigs but can never be marked as verified students.
        </P>
      </Section>

      <Section title="What we collect">
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4, marginBottom: 6 }}>
          <LI>
            Your <strong>email</strong> — @nmsu.edu for students (your login and student verification), any email for
            clients.
          </LI>
          <LI>Your <strong>name</strong> — first and last, so people know who they're working with.</LI>
          <LI>
            Your <strong>phone number</strong> — required, and shared <strong>only</strong> with the other person after a
            gig is matched (see "When contact info is shared" below).
          </LI>
          <LI>
            Optional <strong>payment handles</strong> (Venmo, Cash App, PayPal, Zelle, Apple Pay, Google Pay) and{" "}
            <strong>social handles</strong> (Snapchat, Instagram, Discord) — only if you add them, and only shared the
            same way your phone number is.
          </LI>
          <LI>
            Your <strong>profile photo</strong> — heads up: profile photos are served publicly (anyone with the link can
            load the image).
          </LI>
          <LI>Your <strong>gig activity</strong> — what you post, request, accept, and complete.</LI>
          <LI>Your <strong>reviews and reputation score</strong> — these are visible on the platform by design.</LI>
        </ul>
        <P>We don't track your location, we don't read your texts, we don't follow you around the internet.</P>
      </Section>

      <Section title="When contact info is shared">
        <P>
          This is the whole point of the app, so let's be crystal clear: when a poster{" "}
          <strong>accepts</strong> someone for a gig, both sides see each other's contact card — phone number, email, and
          any payment or social handles you've added. Until that acceptance happens, your contact info stays hidden.
          Don't put anything in your contact card you wouldn't want a matched gig partner to see.
        </P>
      </Section>

      <Section title="What's publicly visible">
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4, marginBottom: 6 }}>
          <LI>
            <strong>Open gigs posted by clients</strong> are visible to anyone on the internet — including people who
            aren't signed in — along with the poster's name, photo, and rating.
          </LI>
          <LI>
            <strong>Gigs posted by students</strong> are visible only to verified NMSU students.
          </LI>
          <LI>Profile photos are publicly accessible images.</LI>
        </ul>
        <P>Contact info is never part of any public view.</P>
      </Section>

      <Section title="How we store it">
        <P>
          Your data lives in <strong>Supabase</strong> (secure, hosted database with encryption and row-level access
          controls). The app is hosted on <strong>Vercel</strong>. Neither sells your data — they're infrastructure
          providers, not ad companies. Fonts and assets are served by us, not third-party CDNs.
        </P>
      </Section>

      <Section title="We do NOT sell your data">
        <P>
          Period. Full stop. Not to advertisers, not to businesses in the Deals tab, not to NMSU, not to anyone. The
          businesses that post deals never see your email, your name, or anything about you.
        </P>
      </Section>

      <Section title="FERPA — students, we got you">
        <P>
          Your @nmsu.edu email is connected to your student status, so <strong>FERPA</strong> is relevant. The deal:
        </P>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4, marginBottom: 6 }}>
          <LI>We don't access or store your academic records. At all.</LI>
          <LI>We don't share your .edu email with third parties.</LI>
          <LI>
            We use your email for sign-in and, if you keep email alerts on in Settings, for transactional messages about
            gigs and reviews — not marketing spam.
          </LI>
        </ul>
        <P>
          We're not part of NMSU's systems and have no access to your student portal. Your GPA is safe with us (mainly
          because we don't have it).
        </P>
      </Section>

      <Section title="Cookies & analytics">
        <P>
          We use basic performance analytics (Vercel Speed Insights) to understand load times — not to track you
          personally. Your login session is kept in your browser's local storage. We don't use advertising cookies or
          third-party trackers.
        </P>
      </Section>

      <Section title="Want your data deleted?">
        <P>
          Start account deletion in <strong>Settings</strong>. There's a 15-day grace period —{" "}
          <strong>signing back in during that window cancels it</strong>. After the grace period, an automated job
          permanently removes your profile, contact info (including your phone number), gig history, reviews, rep,
          notifications, and profile photo. You can also reach us via <strong>Help &amp; support</strong> or the
          community Discord.
        </P>
        <P>Heads up: once it's deleted, it's deleted. We can't get it back for you.</P>
      </Section>

      <Section title="Changes to this policy">
        <P>
          If we update this privacy policy, we'll let you know. We're not going to quietly change things and hope nobody
          notices. That's shady and we're not about that.
        </P>
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
        <LP>GetCampusGig ("we," "us," "our") operates the website getcampusgig.com and related services (collectively, the "Platform"). This Privacy Policy describes how we collect, use, store, share, and protect your personal information when you use the Platform.</LP>
        <LP>By creating an account or using the Platform, you consent to the data practices described in this Privacy Policy.</LP>
      </LegalSection>

      <LegalSection num="2" title="Account Types">
        <LP>The Platform supports two account types:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>
            <strong>Student Accounts:</strong> authenticated via a Main Campus <strong>@nmsu.edu</strong> email address
            (domain exactly <code>nmsu.edu</code>; NMSU extension-campus subdomains are not eligible). Verified-student
            status is derived solely from confirmed control of an @nmsu.edu mailbox.
          </LI>
          <LI>
            <strong>Client Accounts:</strong> registered with any valid email address and a password by individuals or
            organizations seeking to post tasks. Client Accounts cannot obtain verified-student status and cannot accept
            or perform gigs.
          </LI>
        </ul>
      </LegalSection>

      <LegalSection num="3" title="Information We Collect">
        <LP><strong>3.1 Information You Provide</strong></LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
          <LI><strong>Email Address:</strong> used for authentication (and student verification for Student Accounts).</LI>
          <LI><strong>Name:</strong> first and last name, provided during registration.</LI>
          <LI>
            <strong>Phone Number:</strong> required for participation in gig matches; disclosed only as described in
            Section 5 (Contact Information Sharing).
          </LI>
          <LI>
            <strong>Optional Contact and Payment Handles:</strong> payment usernames (e.g., Venmo, Cash App, PayPal,
            Zelle, Apple Pay, Google Pay) and social handles (e.g., Snapchat, Instagram, Discord), if you choose to add
            them; disclosed only as described in Section 5.
          </LI>
          <LI><strong>Profile Information:</strong> optional details such as avatar photo and avatar color preferences. Profile photos are stored in a publicly accessible bucket (see Section 6).</LI>
        </ul>
        <LP><strong>3.2 Information Generated Through Use</strong></LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
          <LI><strong>Gig Activity:</strong> records of gigs posted, requested, accepted, completed, and cancelled.</LI>
          <LI><strong>Reviews and Ratings:</strong> text reviews and star ratings submitted by and about you.</LI>
          <LI><strong>Reputation Score:</strong> a calculated score based on your gig activity and reviews.</LI>
          <LI><strong>Notification Data:</strong> records of in-app notifications and read status.</LI>
        </ul>
        <LP><strong>3.3 Automatically Collected Information</strong></LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI><strong>Performance Analytics:</strong> Vercel Speed Insights collects anonymized performance metrics (page load times, web vitals). This data is not personally identifiable.</LI>
          <LI><strong>Authentication Tokens:</strong> session tokens managed by Supabase, stored in your browser's local storage to maintain your logged-in state.</LI>
        </ul>
      </LegalSection>

      <LegalSection num="4" title="How We Use Your Information">
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>To authenticate your identity and, for Student Accounts, verify NMSU Main Campus student status.</LI>
          <LI>To facilitate the creation, browsing, and management of gig listings.</LI>
          <LI>To share contact information between matched Users as described in Section 5.</LI>
          <LI>To display your profile, reviews, and reputation as described in Section 6.</LI>
          <LI>To populate the leaderboard with reputation rankings.</LI>
          <LI>To send in-app notifications regarding gig updates, reviews, and account activity.</LI>
          <LI>To send optional transactional email when you enable email alerts in Settings. You can turn this off anytime.</LI>
          <LI>To monitor and improve Platform performance and reliability.</LI>
          <LI>To enforce our Terms of Service and protect Platform integrity.</LI>
        </ul>
      </LegalSection>

      <LegalSection num="5" title="Contact Information Sharing Between Users">
        <LP>
          The Platform's core function is connecting a gig poster with the person who will complete the gig. When a
          poster <strong>accepts</strong> a request, the poster and the accepted requester are each shown the other's
          contact card, consisting of: phone number, email address, and any optional payment or social handles the User
          has added to their profile.
        </LP>
        <LP>
          Contact information is never shown to Users who are not party to the matched gig, never shown before
          acceptance, and never included in any publicly visible page. By adding information to your contact card, you
          consent to its disclosure to your matched counterpart when a gig is accepted.
        </LP>
      </LegalSection>

      <LegalSection num="6" title="Public Visibility">
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>
            <strong>Client-posted open gigs</strong> — including title, description, price, location, and the poster's
            name, profile photo, reputation, and review summary — are visible to the general public, including visitors
            who are not signed in.
          </LI>
          <LI>
            <strong>Student-posted gigs</strong> are visible only to authenticated, verified NMSU students.
          </LI>
          <LI>
            <strong>Profile photos</strong> are stored in a publicly accessible storage bucket: anyone with the image URL
            can load the image without authentication.
          </LI>
          <LI>
            <strong>Names, reputation scores, reviews, and gig history</strong> are visible to authenticated Users as
            part of core functionality.
          </LI>
        </ul>
      </LegalSection>

      <LegalSection num="7" title="Data Storage and Security">
        <LP>Your data is stored in <strong>Supabase</strong>, a cloud-hosted PostgreSQL platform employing encryption at rest and in transit, row-level security policies, and access controls.</LP>
        <LP>The Platform frontend is hosted on <strong>Vercel</strong>. Both Supabase and Vercel maintain SOC 2 compliance and implement industry-standard security measures. Fonts and static assets are served first-party (no third-party font CDNs).</LP>
        <LP>While we implement reasonable security measures, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security of your data.</LP>
      </LegalSection>

      <LegalSection num="8" title="Data Sharing and Disclosure">
        <LP><strong>We do not sell, rent, trade, or otherwise disclose your personal information to third parties for marketing or advertising purposes.</strong></LP>
        <LP>We share information only in the following limited circumstances:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI><strong>Between Matched Users:</strong> as described in Section 5.</LI>
          <LI><strong>Public and Platform Visibility:</strong> as described in Section 6.</LI>
          <LI><strong>Service Providers:</strong> Supabase (database/authentication/storage) and Vercel (hosting and performance analytics) process data on our behalf as infrastructure providers.</LI>
          <LI><strong>Legal Compliance:</strong> we may disclose information if required by law, court order, or governmental request, or where disclosure is necessary to protect our rights, your safety, or the safety of others.</LI>
        </ul>
        <LP><strong>Deals Tab Advertisers:</strong> businesses featured in the Deals section do not receive any User data. Advertising relationships are limited to content display only.</LP>
      </LegalSection>

      <LegalSection num="9" title="FERPA (Student Accounts)">
        <LP>
          We recognize that @nmsu.edu email addresses are associated with student status at New Mexico State University
          and that student information may be subject to the Family Educational Rights and Privacy Act (FERPA).
        </LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>We do not access, collect, or store any educational records maintained by NMSU.</LI>
          <LI>We have no access to transcripts, grades, enrollment details, financial aid information, or NMSU student information systems.</LI>
          <LI>The @nmsu.edu email is used solely for identity verification and authentication.</LI>
          <LI>We do not share @nmsu.edu email addresses with third parties.</LI>
          <LI>We are not a school official or institutional affiliate of NMSU and operate under no data-sharing agreement with the university.</LI>
        </ul>
      </LegalSection>

      <LegalSection num="10" title="Data Retention and Deletion">
        <LP>
          We retain your personal information for as long as your account is active. You may request account deletion at
          any time in <strong>Settings</strong>. Deletion follows a fifteen (15) day grace period during which signing in
          again cancels the request. After the grace period, an automated process permanently deletes your profile,
          contact information (including phone number and any payment or social handles), gig history, reviews,
          reputation, notifications, profile photo, and login identity, subject to:
        </LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>Data we are required to retain for legal or regulatory compliance.</LI>
          <LI>Anonymized or aggregated data that cannot identify you.</LI>
          <LI>Backup copies purged automatically on our providers' retention schedules.</LI>
        </ul>
      </LegalSection>

      <LegalSection num="11" title="User Rights">
        <LP>You have the right to:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
          <LI><strong>Access:</strong> request a copy of the personal information we hold about you.</LI>
          <LI><strong>Correction:</strong> request correction of inaccurate personal information.</LI>
          <LI><strong>Deletion:</strong> request deletion of your account and associated personal data.</LI>
          <LI><strong>Portability:</strong> request your data in a structured, commonly used format.</LI>
        </ul>
        <LP>
          To exercise any of these rights, use <strong>Help &amp; support</strong> from your profile in the app (include
          how to reach you), or join our community Discord (
          <a href={COMMUNITY_DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">
            invite link
          </a>
          ) and ask for <strong>@{DISCORD_SUPPORT_USERNAME}</strong>. We respond to verified requests within thirty (30)
          days where feasible.
        </LP>
      </LegalSection>

      <LegalSection num="12" title="Children's Privacy">
        <LP>The Platform is intended for users eighteen (18) years of age or older, and is not directed to children under thirteen (13). We do not knowingly collect personal information from children under 13. If we become aware that we have collected data from a child under 13, we will promptly delete it.</LP>
      </LegalSection>

      <LegalSection num="13" title="Third-Party Links">
        <LP>The Platform may contain links to third-party websites or services (including payment platforms referenced in gig listings). We are not responsible for the privacy practices of these third parties. Review the privacy policies of any third-party services you use.</LP>
      </LegalSection>

      <LegalSection num="14" title="Changes to This Privacy Policy">
        <LP>We may update this Privacy Policy from time to time. Material changes will be communicated through the Platform. Continued use of the Platform after modifications constitutes acceptance of the updated Privacy Policy.</LP>
      </LegalSection>

      <LegalSection num="15" title="Contact Information">
        <LP>
          For questions about this Privacy Policy or your personal data, use <strong>Help &amp; support</strong> from your
          profile in the app, or join the GetCampusGig community Discord (
          <a href={COMMUNITY_DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">
            invite link
          </a>
          ) and ask for <strong>@{DISCORD_SUPPORT_USERNAME}</strong>.
        </LP>
        <LP>
          <strong>Website:</strong> getcampusgig.com
        </LP>
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
