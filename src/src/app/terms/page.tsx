export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#07110E] text-white px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold mb-8">
          Terms of Service
        </h1>

        <div className="space-y-6 text-zinc-300 leading-7">
          <p>
            Novua Inbox is an operational software platform designed to help teams
            prioritize inbound conversations and workflows.
          </p>

          <p>
            By creating an account, you agree to use the platform responsibly and
            in compliance with applicable laws.
          </p>

          <p>
            Trial accounts may be limited, modified, or suspended at any time.
          </p>

          <p>
            The service is provided “as is” without guarantees of uninterrupted
            availability or specific business outcomes.
          </p>

          <p>
            Users are responsible for the data and conversations processed through
            their workspace.
          </p>

          <p>
            For questions regarding these terms, contact:
            <br />
            contact@novua.digital
          </p>
        </div>
      </div>
    </main>
  );
}