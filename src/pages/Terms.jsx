import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Scale } from "lucide-react";

const LAST_UPDATED = "April 13, 2026";

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
          This is the "no cap" version. We made it easy to read so you actually know what you're agreeing to. The full legal version is in the other tab if you want all the fine print.
        </div>
      </div>

      <Section title="What even is GetCampusGig?">
        <P>It's a marketplace where NMSU students post small tasks and gigs, and other students pick them up for pay. Think of it like a campus-only Craigslist, but less sketchy and only for Aggies.</P>
      </Section>

      <Section title="Who can use it?">
        <P>
          You need a valid <strong>@nmsu.edu</strong> email from <strong>NMSU Main Campus in Las Cruces</strong>. We do{" "}
          <strong>not</strong> accept extension or branch-campus addresses — for example, not{" "}
          <strong>@dacc.nmsu.edu</strong>, <strong>@alamogordo.nmsu.edu</strong>, <strong>@grants.nmsu.edu</strong>, or{" "}
          <strong>@global.nmsu.edu</strong> (and not other <code>*.nmsu.edu</code> subdomains). If you can&apos;t log in
          with a Main Campus <strong>@nmsu.edu</strong> address, you can&apos;t use the platform. No exceptions — this
          is how we keep it Main Campus–only.
        </P>
      </Section>

      <Section title="Payments are between y'all">
        <P>We do <strong>NOT</strong> handle any money. Zero. Nada. You pay each other through Cash App, Venmo, PayPal, or whatever you and the other person agree on. If someone doesn't pay up or there's a dispute, that's between you two — we literally can't intervene because the money never touches our platform.</P>
        <P>Be smart: discuss payment terms before starting a gig. Screenshot your agreements if you want receipts.</P>
      </Section>

      <Section title="Don't be weird">
        <P>Seriously. No scams, no harassment, no posting illegal stuff, no fake reviews, no catfishing with someone else's identity. This is a community of students — treat people the way you'd want to be treated on campus.</P>
        <P>If you post a gig, actually follow through. If you accept a gig, actually do it. Ghosting people tanks your reputation score and could get your account banned.</P>
      </Section>

      <Section title="Reviews & reputation are real">
        <P>After a gig is done, both sides can leave reviews. These are public and build your reputation score. Don't leave fake reviews, revenge reviews, or try to game the system. We can remove reviews that violate our guidelines and take action against your account.</P>
        <P>Your rep score shows up on the leaderboard. Everyone can see it. So maybe don't be a jerk.</P>
      </Section>

      <Section title="We can ban you">
        <P>If you break these rules, we can suspend or permanently delete your account. We don't need to give you a heads up (but we'll try to be fair about it). Repeat offenders get zero sympathy.</P>
      </Section>

      <Section title="The Deals tab">
        <P>We have a Deals tab where local businesses post coupons and offers. It's totally optional — you choose to visit it. We do <strong>NOT</strong> share your data with those businesses. They pay us to show their deals; they don't get your info.</P>
      </Section>

      <Section title="We're not responsible for everything">
        <P>We built the platform. We didn't hire the person doing your laundry. If a gig goes sideways, that's between the users involved. We provide the marketplace — what happens in the gig stays in the gig (unless someone violates our rules, then we step in on the platform side).</P>
        <P>The platform is provided "as is." We do our best to keep things running smoothly, but we can't guarantee 100% uptime or that every interaction will be perfect.</P>
      </Section>

      <Section title="Changes to these terms">
        <P>We might update these terms from time to time. If we make big changes, we'll let you know. By continuing to use GetCampusGig after updates, you're agreeing to the new terms.</P>
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

      <LegalSection num="2" title="Eligibility">
        <LP>
          The Platform is exclusively available to currently enrolled students at NMSU&apos;s <strong>Main Campus in Las Cruces</strong> who possess a valid email address on the <strong>nmsu.edu</strong> domain only (i.e., <code>username@nmsu.edu</code>). Email addresses on NMSU system subdomains — including without limitation <strong>dacc.nmsu.edu</strong>, <strong>alamogordo.nmsu.edu</strong>, <strong>grants.nmsu.edu</strong>, and <strong>global.nmsu.edu</strong> — are not eligible. The Platform does not serve off-campus-only or extension-campus populations under separate NMSU email domains. By creating an account, you represent and warrant that:
        </LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>You are a currently enrolled student at NMSU&apos;s Main Campus in Las Cruces.</LI>
          <LI>The @nmsu.edu email address you provide is your own, is currently active, and is not a branch- or extension-campus email domain.</LI>
          <LI>You are at least eighteen (18) years of age, or the age of majority in your jurisdiction.</LI>
          <LI>You have the legal capacity to enter into these Terms.</LI>
        </ul>
        <LP>We reserve the right to verify your enrollment status and to terminate accounts that no longer meet these eligibility requirements.</LP>
      </LegalSection>

      <LegalSection num="3" title="Account Registration and Security">
        <LP>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account. We are not liable for any loss arising from unauthorized access to your account.</LP>
        <LP>You may not create multiple accounts, impersonate another person, or use another student's credentials to access the Platform.</LP>
      </LegalSection>

      <LegalSection num="4" title="Platform Description and Scope of Service">
        <LP>GetCampusGig is a peer-to-peer marketplace that facilitates connections between NMSU students seeking to post small tasks or gigs ("Posters") and students willing to complete those tasks ("Takers"). The Platform provides the technological infrastructure to list, browse, accept, and manage gigs.</LP>
        <LP>GetCampusGig is not a party to any agreement, transaction, or arrangement between Users. We do not employ, endorse, guarantee, or supervise any User. The Platform is solely a venue for facilitating connections.</LP>
      </LegalSection>

      <LegalSection num="5" title="Payment Disclaimer">
        <LP><strong>GetCampusGig does not process, facilitate, or intermediate any financial transactions.</strong> All payments for completed gigs are conducted independently between Users through third-party payment platforms (including but not limited to Cash App, Venmo, and PayPal) at their sole discretion.</LP>
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
          <LI>Use the Platform for commercial solicitation unrelated to campus gigs.</LI>
          <LI>Attempt to circumvent Platform security measures or interfere with Platform operations.</LI>
          <LI>Scrape, harvest, or collect User data through automated means.</LI>
          <LI>Impersonate another User or misrepresent your identity or affiliation.</LI>
        </ul>
      </LegalSection>

      <LegalSection num="7" title="Gig Disputes">
        <LP>Disputes arising from the quality, completion, or scope of gigs are matters between the involved Users. GetCampusGig is not obligated to intervene in gig disputes but may, at its sole discretion, take action including but not limited to removing gig listings, adjusting reputation scores, or suspending accounts when Platform rules are violated.</LP>
        <LP>We encourage Users to communicate clearly about expectations, deliverables, and timelines before commencing any gig.</LP>
      </LegalSection>

      <LegalSection num="8" title="Reviews and Reputation">
        <LP>Users may submit reviews following the completion of a gig. Reviews contribute to a User's reputation score, which is publicly visible on the Platform, including on the leaderboard.</LP>
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
          <LI>Loss of NMSU enrollment or @nmsu.edu email access.</LI>
          <LI>Inactivity for an extended period.</LI>
          <LI>At our sole discretion for the safety and integrity of the Platform.</LI>
        </ul>
        <LP>Upon termination, your right to access the Platform ceases immediately. We are not liable for any loss resulting from account termination.</LP>
      </LegalSection>

      <LegalSection num="11" title="Intellectual Property">
        <LP>All content, trademarks, logos, and intellectual property displayed on the Platform are owned by or licensed to GetCampusGig. Users retain ownership of content they submit but grant us a non-exclusive, royalty-free license to display and use such content in connection with the operation of the Platform.</LP>
      </LegalSection>

      <LegalSection num="12" title="Disclaimer of Warranties">
        <LP>THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</LP>
        <LP>WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT ANY DEFECTS WILL BE CORRECTED.</LP>
      </LegalSection>

      <LegalSection num="13" title="Limitation of Liability">
        <LP>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, GETCAMPUSGIG AND ITS OPERATORS, OFFICERS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:</LP>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          <LI>YOUR ACCESS TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE PLATFORM.</LI>
          <LI>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY OR USER ON THE PLATFORM.</LI>
          <LI>ANY TRANSACTIONS OR INTERACTIONS BETWEEN USERS.</LI>
          <LI>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR CONTENT OR DATA.</LI>
        </ul>
      </LegalSection>

      <LegalSection num="14" title="Indemnification">
        <LP>You agree to indemnify, defend, and hold harmless GetCampusGig and its operators from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or related to your use of the Platform, your violation of these Terms, or your violation of any rights of another party.</LP>
      </LegalSection>

      <LegalSection num="15" title="Governing Law">
        <LP>These Terms shall be governed by and construed in accordance with the laws of the State of New Mexico, without regard to its conflict of laws principles. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Doña Ana County, New Mexico.</LP>
      </LegalSection>

      <LegalSection num="16" title="Contact">
        <LP>For questions or concerns regarding these Terms, please contact us at:</LP>
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
          style={{ padding: 0, gap: 4, marginBottom: 16 }}
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
