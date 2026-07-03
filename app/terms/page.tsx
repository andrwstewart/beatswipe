import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — BeatSwipe',
  description: 'Terms of Service for BeatSwipe',
}

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-background px-5 py-12 max-w-2xl mx-auto">
      <Link href="/" className="text-sm text-primary hover:underline mb-8 block">← Back</Link>

      <h1 className="text-3xl font-extrabold mb-1">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: June 26, 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-foreground/85">

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using BeatSwipe ("the Service," "we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use the Service. These Terms apply to all visitors, users, and anyone else who accesses the Service.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">2. Description of Service</h2>
          <p>BeatSwipe is a music discovery and collaboration platform that allows producers to upload and share original beats, and allows artists and listeners to discover, download, and interact with that content. We do not produce, own, or claim rights to any user-uploaded beats.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">3. Eligibility</h2>
          <p>You must be at least 13 years old to use the Service. By creating an account, you represent and warrant that you meet this age requirement and that all information you provide is accurate and truthful. If you are under 18, you represent that a parent or legal guardian has reviewed and agreed to these Terms on your behalf.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">4. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to notify us immediately of any unauthorized use of your account. BeatSwipe is not liable for any loss or damage arising from your failure to protect your account credentials. We reserve the right to terminate accounts, remove content, or deny access to the Service at our sole discretion, at any time, with or without notice.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">5. User-Generated Content</h2>
          <p className="mb-3">By uploading beats, profile content, messages, or any other material to BeatSwipe ("User Content"), you represent and warrant that:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You own all rights to the content, or have obtained all necessary licenses, permissions, and clearances to upload and share it.</li>
            <li>Your content does not infringe any copyright, trademark, trade secret, patent, or other intellectual property or proprietary rights of any third party.</li>
            <li>Your content does not contain samples, loops, or recordings owned by a third party unless you hold a valid license for such use.</li>
            <li>Your content does not violate any applicable law, including laws governing defamation, privacy, obscenity, or harassment.</li>
          </ul>
          <p className="mt-3">You retain full ownership of your User Content. By uploading content to BeatSwipe, you grant us a worldwide, non-exclusive, royalty-free, sublicensable license to host, store, reproduce, display, stream, and distribute your content solely for the purpose of operating and providing the Service.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">6. Prohibited Conduct</h2>
          <p className="mb-3">You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Upload content you do not own or have permission to distribute.</li>
            <li>Upload beats that contain unlicensed samples from copyrighted recordings.</li>
            <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
            <li>Use the Service for any unlawful purpose or in violation of any applicable regulations.</li>
            <li>Harass, threaten, or abuse other users through messages or any other feature of the Service.</li>
            <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
            <li>Use automated tools (bots, scrapers, crawlers) to access, copy, or collect content from the Service without our express written consent.</li>
            <li>Sell, resell, or commercially exploit access to the Service without our written permission.</li>
            <li>Upload content that contains malware, viruses, or any other malicious code.</li>
            <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service.</li>
          </ul>
          <p className="mt-3">We reserve the right to remove any content that violates these Terms or that we find objectionable, and to terminate the accounts of repeat violators.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">7. Copyright and DMCA</h2>
          <p className="mb-3">BeatSwipe respects the intellectual property rights of others and expects users to do the same. If you believe that content on BeatSwipe infringes your copyright, please send a written notice containing the following to <span className="text-primary">legal@beatswipe.com</span>:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>A description of the copyrighted work you claim has been infringed.</li>
            <li>The URL or specific location of the allegedly infringing content on BeatSwipe.</li>
            <li>Your contact information (name, address, phone number, email).</li>
            <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner, its agent, or the law.</li>
            <li>A statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on the owner's behalf.</li>
            <li>Your physical or electronic signature.</li>
          </ul>
          <p className="mt-3">Upon receiving a valid DMCA notice, we will remove or disable access to the allegedly infringing content and notify the uploader. Users who repeatedly infringe copyrights will have their accounts terminated.</p>
          <p className="mt-3">BeatSwipe qualifies for safe harbor protection under the Digital Millennium Copyright Act (17 U.S.C. § 512) as a service provider that hosts user-generated content. We are not liable for infringing content uploaded by users, provided we act expeditiously upon receiving proper notice.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">8. Free Downloads — Producer Acknowledgment</h2>
          <p className="mb-3">BeatSwipe operates as a free beat discovery platform. By uploading a beat to BeatSwipe, producers explicitly acknowledge and agree to the following:</p>
          <ul className="list-disc pl-5 space-y-1.5 mb-3">
            <li><strong>Beats are available for free download.</strong> Any registered user on BeatSwipe may download your uploaded beats at no cost. This is a core and intended feature of the platform.</li>
            <li><strong>You are choosing to make your beat available for free.</strong> Uploading a beat constitutes your voluntary decision to distribute it freely through BeatSwipe. If you do not wish your beat to be downloaded for free, do not upload it to the Service.</li>
            <li><strong>BeatSwipe is not liable for free downloads of your content.</strong> By uploading, you waive any claim against BeatSwipe arising from users downloading your beat at no charge.</li>
            <li><strong>Ownership is not transferred.</strong> A free download grants the downloader a personal, non-exclusive license for non-commercial use only. You retain full copyright and ownership of your beat at all times.</li>
            <li><strong>Commercial use still requires your permission.</strong> A free download does not grant the downloader the right to release, sell, or commercially exploit your beat. Any commercial licensing remains a private agreement solely between you and the artist, independent of BeatSwipe.</li>
            <li><strong>BeatSwipe does not collect revenue on your behalf</strong> from downloads, streams, or any use of your content on the platform. The platform does not act as your publisher, label, or licensing agent.</li>
          </ul>
          <p>If you do not agree with these terms regarding free downloads, you must not upload your beats to BeatSwipe.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">9. Privacy</h2>
          <p>Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of your information as described in our Privacy Policy.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">10. Disclaimers</h2>
          <p className="mb-2">THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>
          <p>WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE DO NOT WARRANT THE ACCURACY, COMPLETENESS, OR USEFULNESS OF ANY CONTENT ON THE SERVICE.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">11. Limitation of Liability</h2>
          <p>TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, BEATSWIPE AND ITS OWNERS, OFFICERS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, GOODWILL, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
          <p className="mt-3">IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE EXCEED ONE HUNDRED DOLLARS ($100.00) OR THE AMOUNT YOU PAID US IN THE PAST SIX MONTHS, WHICHEVER IS GREATER.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">12. Indemnification</h2>
          <p>You agree to indemnify, defend, and hold harmless BeatSwipe and its owners, officers, employees, agents, and licensors from and against any and all claims, liabilities, damages, losses, costs, expenses, and fees (including reasonable attorneys' fees) arising out of or relating to: (a) your use of the Service; (b) your User Content; (c) your violation of these Terms; (d) your violation of any rights of another person or entity; or (e) any claim that your User Content caused damage to a third party.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">13. Termination</h2>
          <p>We may suspend or terminate your account and access to the Service at any time, with or without cause, and with or without notice, including for violation of these Terms. Upon termination, your right to use the Service will immediately cease. We reserve the right to remove your content from the Service upon termination. Provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">14. Modifications to the Service and Terms</h2>
          <p>We reserve the right to modify or discontinue the Service, or any part of it, at any time without notice. We also reserve the right to update these Terms at any time. When we make changes, we will update the "Last updated" date at the top of this page. Your continued use of the Service after any changes constitutes your acceptance of the new Terms. It is your responsibility to review these Terms periodically.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">15. Governing Law and Dispute Resolution</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any dispute arising out of or relating to these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If that fails, disputes shall be resolved by binding arbitration rather than in court, except that you may assert claims in small claims court if your claims qualify.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">16. Entire Agreement</h2>
          <p>These Terms constitute the entire agreement between you and BeatSwipe with respect to the Service and supersede all prior and contemporaneous agreements, understandings, and communications, whether written or oral, relating to the subject matter herein.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">17. Contact</h2>
          <p>If you have any questions about these Terms, please contact us at <span className="text-primary">legal@beatswipe.com</span>.</p>
        </section>

      </div>

      <div className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
        © {new Date().getFullYear()} BeatSwipe. All rights reserved.
      </div>
    </div>
  )
}
