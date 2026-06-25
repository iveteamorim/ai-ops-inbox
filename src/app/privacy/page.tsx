export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#07110E] text-white px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold mb-8">
          Privacy Policy
        </h1>

        <div className="space-y-6 text-zinc-300 leading-7">
          <p>
            Novua Inbox processes operational and contact data provided by users
            during the use of the platform.
          </p>

          <p>
            We may use third-party services including Supabase, OpenAI, Stripe,
            and Meta/WhatsApp to provide core platform functionality.
          </p>

          <p>
            User data is used only to operate, improve, and secure the service.
          </p>

          <p>
            We do not sell personal data to third parties.
          </p>

          <p>
            Users are responsible for ensuring they have permission to process
            customer conversations and contact information.
          </p>

          <p>
            If you wish to request deletion of your data, contact:
            <br />
            contact@novua.digital
          </p>
        </div>
      </div>
    </main>
  );
}