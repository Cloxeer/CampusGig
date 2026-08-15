import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Scale } from "lucide-react";
import { COMMUNITY_DISCORD_INVITE_URL, DISCORD_SUPPORT_USERNAME } from "../utils/supportCommunity";

const LAST_UPDATED = "August 14, 2026";

function SummarizedTerms() {
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
          This is the "no cap" version. We made it easy to read so you actually know what you're agreeing to. The full
          legal version is in the other tab if you want all the fine print.
        </div>
      </div>

      <Section title="What even is GetCampusGig?">
        <P>
          It's a marketplace where <strong>anyone can post a task</strong> — students, locals, businesses, film shoots,
          shelters, you name it — and <strong>verified NMSU students get it done for pay</strong>. Students can also post
          student-to-student gigs that only other students see.
        </P>
      </Section>

      <Section title="Who can use it?">
        <P>
          <strong>Students:</strong> you need a valid <strong>@nmsu.edu</strong> email from{" "}
          <strong>NMSU Main Campus in Las Cruces</strong> (not extension domains like <strong>@dacc.nmsu.edu</strong> or{" "}
          <strong>@global.nmsu.edu</strong>). Only verified students can take on gigs.
        </P>
        <P>
          <strong>Clients:</strong> anyone 18 or older can create an account with any email to post work for students.
          Clients can't take gigs — posting only.
        </P>
        <P>Everyone must be at least <strong>18 years old</strong>. No exceptions.</P>
      </Section>

      <Section title="We don't vet anyone — meet smart">
        <P>
          Real talk: <strong>we do not background-check, identity-verify, or vet anyone</strong> beyond confirming
          students control an @nmsu.edu inbox and clients control their email. When you take a gig or hire someone,
          you're dealing with a stranger. Meet in public places when you can, tell someone where you're going, trust your
          gut, and use the report button if anything feels off. <strong>You take gigs at your own risk.</strong>
        </P>
      </Section>

      <Section title="Payments are between y'all">
        <P>
          We do <strong>NOT</strong> handle any money. Zero. Nada. You pay each other through Cash App, Venmo, PayPal, or
          whatever you agree on. If someone doesn't pay up, that's between you two — the money never touches our
          platform.
        </P>
        <P>
          Our advice for bigger jobs: agree on a <strong>25–50% deposit up front</strong>, rest on completion. That's a
          suggestion, not a guarantee — screenshot your agreements if you want receipts.
        </P>
      </Section>

      <Section title="Not affiliated with NMSU">
        <P>
          GetCampusGig is an independent platform. We are <strong>not affiliated with, endorsed by, or operated by</strong>{" "}
          New Mexico State University or ASNMSU. "NMSU" appears on this site only to describe which students we verify.
        </P>
      </Section>

      <Section title="Don't be weird">
        <P>
          No scams, no harassment, no illegal gigs, no fake reviews, no catfishing. This is a community — treat people the
          way you'd want to be treated.
        </P>
        <P>
          If you post a gig, follow through. If you accept one, do it. Ghosting tanks your reputation and can get your
          account banned.
        </P>
      </Section>

      <Section title="Reviews & reputation are real">
        <P>
          After a gig, both sides can leave reviews. They're public and build your reputation score. No fake reviews,
          revenge reviews, or gaming the system — we can remove reviews and take action on your account.
        </P>
      </Section>

      <Section title="We can ban you">
        <P>
          Break these rules and we can suspend or permanently delete your account, with or without a heads up (we'll try
          to be fair about it). Repeat offenders get zero sympathy.
        </P>
      </Section>

      <Section title="The Deals tab">
        <P>
          Local businesses can post coupons and offers in the Deals tab. Totally optional, and we do <strong>NOT</strong>{" "}
          share your data with those businesses. They pay us to show deals; they don't get your info.
        </P>
      </Section>

      <Section title="We're not responsible for everything">
        <P>
          We built the platform; we're not a party to your gigs. If a gig goes sideways, that's between the users
          involved (we step in on the platform side when rules are broken). The platform is provided "as is" — we do our
          best, but we can't guarantee perfection.
        </P>
      </Section>

      <Section title="Changes to these terms">
        <P>
          We might update these terms. Big changes, we'll let you know. Continuing to use GetCampusGig after updates
          means you agree to the new terms.
        </P>
      </Section>

      <div style={{ fontSize: 12, color: "var(--fg4)", fontFamily: "var(--mono)", textAlign: "center", marginTop: 8 }}>
        Last updated: {LAST_UPDATED}
      </div>
    </div>
  );
}

function LegalTerms() {
  return (
    <div style={{ padding: "20px 20px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)", lineHeight: 1.6 }}>
        Effective Date: {LAST_UPDATED}
      </div>

      <LegalSection num="1" title="Acceptance of Terms">
        <LP>By accessing or using GetCampusGig ("the Platform"), available at getcampusgig.com, you ("User," "you") agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not access or use the Platform.</LP>
        <LP>These Terms constitute a legally binding agreement between you and GetCampusGig ("we," "us," "our"). We reserve the right to modify these Terms at any time. Continued use of the Platform after modifications constitutes acceptance of the revised Terms.</LP>
      </LegalSection>

      <LegalSection num="2" title="Eligibility and Account Types">
        <LP>The Platform offers two account types:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
          <LI>
            <strong>Student Accounts</strong> — available to currently enrolled students at NMSU&apos;s Main Campus in
            Las Cruces holding a valid email on the <strong>nmsu.edu</strong> domain only (i.e.,{" "}
            <code>username@nmsu.edu</code>; NMSU system subdomains such as <strong>dacc.nmsu.edu</strong>,{" "}
            <strong>alamogordo.nmsu.edu</strong>, <strong>grants.nmsu.edu</strong>, and <strong>global.nmsu.edu</strong>{" "}
            are not eligible). Only Student Accounts with a verified @nmsu.edu email may request, accept, or perform
            gigs.
          </LI>
          <LI>
            <strong>Client Accounts</strong> — available to any individual or organization wishing to post tasks for
            students to complete. Client Accounts may post and manage gigs but may not request, accept, or perform gigs.
          </LI>
        </ul>
        <LP>By creating an account of either type, you represent and warrant that:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>You are at least eighteen (18) years of age.</LI>
          <LI>The email address you provide is your own and is currently active.</LI>
          <LI>For Student Accounts: you are a currently enrolled student at NMSU&apos;s Main Campus in Las Cruces.</LI>
          <LI>You have the legal capacity to enter into these Terms.</LI>
        </ul>
        <LP>We reserve the right to verify eligibility and to terminate accounts that do not meet these requirements.</LP>
      </LegalSection>

      <LegalSection num="3" title="Account Registration and Security">
        <LP>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account. We are not liable for any loss arising from unauthorized access to your account.</LP>
        <LP>You may not create multiple accounts, impersonate another person, or use another person's credentials to access the Platform.</LP>
      </LegalSection>

      <LegalSection num="4" title="Platform Description; No Vetting; Assumption of Risk">
        <LP>GetCampusGig is a peer-to-peer marketplace that facilitates connections between users posting tasks ("Posters") and verified NMSU students willing to complete those tasks ("Takers"). The Platform provides the technological infrastructure to list, browse, accept, and manage gigs.</LP>
        <LP>GetCampusGig is not a party to any agreement, transaction, or arrangement between Users. We do not employ, endorse, guarantee, or supervise any User. The Platform is solely a venue for facilitating connections.</LP>
        <LP>
          <strong>No Vetting.</strong> Beyond confirming control of an email address (and, for Student Accounts, of an
          @nmsu.edu mailbox), we do <strong>not</strong> conduct background checks, identity verification, or screening
          of any User, and we make no representation about any User's identity, character, qualifications, or
          suitability.
        </LP>
        <LP>
          <strong>Assumption of Risk.</strong> Gigs may involve meeting other Users in person. You acknowledge and agree
          that you interact with other Users, including in person, entirely at your own risk, and you release
          GetCampusGig from any claims arising out of interactions or dealings between Users to the maximum extent
          permitted by law. We encourage Users to meet in public places, inform others of their plans, and report
          concerning behavior through the Platform's reporting tools.
        </LP>
      </LegalSection>

      <LegalSection num="5" title="Payment Disclaimer">
        <LP><strong>GetCampusGig does not process, facilitate, hold, or intermediate any financial transactions.</strong> All payments for gigs are conducted independently between Users through third-party payment platforms (including but not limited to Cash App, Venmo, and PayPal) at their sole discretion.</LP>
        <LP>Any guidance the Platform displays regarding payment practices (for example, suggesting a partial deposit before larger jobs) is informational only and is not a guarantee, escrow, or mediation service.</LP>
        <LP>We are not responsible for, and expressly disclaim any liability arising from:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>Non-payment or late payment for completed gigs.</LI>
          <LI>Payment disputes between Users.</LI>
          <LI>Fraudulent payment activity.</LI>
          <LI>Chargebacks, reversals, or errors on third-party payment platforms.</LI>
          <LI>Any financial loss arising from transactions between Users.</LI>
        </ul>
        <LP>Users acknowledge that all payment arrangements are solely between the parties involved and that GetCampusGig has no obligation to mediate, arbitrate, or resolve payment-related disputes.</LP>
      </LegalSection>

      <LegalSection num="6" title="User Conduct">
        <LP>You agree not to:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>Post gigs that involve illegal activities, violate university policies, or promote harm.</LI>
          <LI>Harass, threaten, intimidate, or discriminate against other Users.</LI>
          <LI>Submit false, misleading, or deceptive gig listings or profile information.</LI>
          <LI>Manipulate reviews, ratings, or reputation scores through fraudulent means.</LI>
          <LI>Use the Platform for commercial solicitation unrelated to posting or performing gigs.</LI>
          <LI>Attempt to circumvent Platform security measures or interfere with Platform operations.</LI>
          <LI>Scrape, harvest, or collect User data through automated means.</LI>
          <LI>Impersonate another User or misrepresent your identity or affiliation.</LI>
        </ul>
      </LegalSection>

      <LegalSection num="7" title="Gig Disputes">
        <LP>Disputes arising from the quality, completion, scope, or payment of gigs are matters between the involved Users. GetCampusGig is not obligated to intervene but may, at its sole discretion, take action including removing gig listings, adjusting reputation scores, or suspending accounts when Platform rules are violated.</LP>
        <LP>We encourage Users to communicate clearly about expectations, deliverables, payment, and timelines before commencing any gig.</LP>
      </LegalSection>

      <LegalSection num="8" title="Reviews and Reputation">
        <LP>Users may submit reviews following the completion of a gig. Reviews contribute to a User's reputation score, which is visible on the Platform, including on the leaderboard, and — for client-posted open gigs — to the general public.</LP>
        <LP>Reviews must be honest, fair, and based on genuine interactions. We reserve the right to remove reviews that are:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>Defamatory, harassing, or retaliatory in nature.</LI>
          <LI>Fraudulent or submitted by parties not involved in the gig.</LI>
          <LI>In violation of these Terms or applicable law.</LI>
        </ul>
        <LP>Systematic manipulation of the review or reputation system may result in account termination.</LP>
      </LegalSection>

      <LegalSection num="9" title="Deals and Advertising">
        <LP>The Platform may feature a "Deals" section containing promotional offers from local businesses. These offers are presented on an opt-in basis — Users choose whether to view them. GetCampusGig does not share, sell, or disclose any User data to advertisers or business partners featured in the Deals section.</LP>
      </LegalSection>

      <LegalSection num="10" title="Account Termination">
        <LP>We reserve the right to suspend or terminate your account at any time, with or without prior notice, for any reason, including but not limited to:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>Violation of these Terms.</LI>
          <LI>Fraudulent, abusive, or illegal conduct.</LI>
          <LI>For Student Accounts: loss of NMSU enrollment or @nmsu.edu email access.</LI>
          <LI>Inactivity for an extended period.</LI>
          <LI>At our sole discretion for the safety and integrity of the Platform.</LI>
        </ul>
        <LP>Upon termination, your right to access the Platform ceases immediately. We are not liable for any loss resulting from account termination.</LP>
      </LegalSection>

      <LegalSection num="11" title="Intellectual Property">
        <LP>All content, trademarks, logos, and intellectual property displayed on the Platform are owned by or licensed to GetCampusGig. Users retain ownership of content they submit but grant us a non-exclusive, royalty-free license to display and use such content in connection with the operation of the Platform.</LP>
      </LegalSection>

      <LegalSection num="12" title="No Affiliation with NMSU">
        <LP>
          GetCampusGig is an independent platform and is <strong>not affiliated with, endorsed by, sponsored by, or
          operated by</strong> New Mexico State University ("NMSU"), the Associated Students of NMSU (ASNMSU), or any of
          their affiliates. References to "NMSU" on the Platform are used solely to describe the student population whose
          email domain we verify. All NMSU-related trademarks are the property of their respective owners.
        </LP>
      </LegalSection>

      <LegalSection num="13" title="Disclaimer of Warranties">
        <LP>THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</LP>
        <LP>WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT ANY DEFECTS WILL BE CORRECTED.</LP>
      </LegalSection>

      <LegalSection num="14" title="Limitation of Liability">
        <LP>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, GETCAMPUSGIG AND ITS OPERATORS, OFFICERS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>YOUR ACCESS TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE PLATFORM.</LI>
          <LI>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY OR USER ON THE PLATFORM.</LI>
          <LI>ANY TRANSACTIONS, INTERACTIONS, OR IN-PERSON MEETINGS BETWEEN USERS.</LI>
          <LI>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR CONTENT OR DATA.</LI>
        </ul>
      </LegalSection>

      <LegalSection num="15" title="Indemnification">
        <LP>You agree to indemnify, defend, and hold harmless GetCampusGig and its operators from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or related to your use of the Platform, your violation of these Terms, or your violation of any rights of another party.</LP>
      </LegalSection>

      <LegalSection num="16" title="Governing Law">
        <LP>These Terms shall be governed by and construed in accordance with the laws of the State of New Mexico, without regard to its conflict of laws principles. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Doña Ana County, New Mexico.</LP>
      </LegalSection>

      <LegalSection num="17" title="Contact">
        <LP>
          For questions about these Terms, join the GetCampusGig community Discord (
          <a href={COMMUNITY_DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">
            invite link
          </a>
          ) and ask for <strong>@{DISCORD_SUPPORT_USERNAME}</strong>. You can also use{" "}
          <strong>Help &amp; support</strong> from your profile in the app to leave a message with your preferred contact
          details.
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

function LI({ children }) {
  return <li style={{ fontSize: 13, color: "var(--fg2)", lineHeight: 1.7 }}>{children}</li>;
}

export default function Terms() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("summary");

  return (
    <div className="page fadein">
      <div style={{ padding: "16px 20px 0", borderBottom: "1px solid var(--bd)" }}>
        <button
          className="btn bg-btn"
          style={{ padding: "0 6px", gap: 4, marginBottom: 16 }}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={13} /> Back
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.035em", marginBottom: 2 }}>
          Terms of Service
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
        {tab === "summary" ? <SummarizedTerms /> : <LegalTerms />}
      </div>
    </div>
  );
}
