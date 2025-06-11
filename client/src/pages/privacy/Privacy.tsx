// See CHANGELOG.md for 2025-06-10 [Added]

const Privacy = () => {
  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none md:pt-0 pt-16 px-4">
      <div className="max-w-3xl mx-auto py-6 prose prose-neutral dark:prose-invert">
        <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: June 12, 2025</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
        <p>
          We collect the following data when you use the app:
          <ul className="list-disc pl-5">
            <li>Messages sent to and from your connected Instagram account</li>
            <li>Thread metadata like timestamps and participant IDs</li>
            <li>Access tokens for API communication (stored securely)</li>
            <li>Optional usage metrics (for performance monitoring)</li>
          </ul>
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Your Data</h2>
        <p>We use your data to support AI-assisted messaging, display conversations, and perform requested actions such as reply, delete, or sync.</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">3. Data Retention</h2>
        <p>
          Message data is retained for <strong>30 days</strong> by default and then permanently deleted.
          You may also:
          <ul className="list-disc pl-5">
            <li>Delete an individual message</li>
            <li>Delete a full conversation thread</li>
            <li>Delete all your data with a single action</li>
          </ul>
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">4. Sharing and Disclosure</h2>
        <p>We do not sell or share your data with third parties. Data is only accessible to you and authorized services for AI processing.</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">5. Security Practices</h2>
        <p>Data is encrypted in transit, stored securely, and access tokens are never exposed to the frontend.</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">6. Your Rights and Controls</h2>
        <p>You may disconnect your account, delete any or all data, and control your data retention preferences via app settings.</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">7. Changes to This Policy</h2>
        <p>We may update this policy and will notify users of any material changes in the app or via email.</p>
      </div>
    </main>
  );
};

export default Privacy;
