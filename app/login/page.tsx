import type { Metadata } from "next"
import { LoginForm } from "@/components/login-form"
import { Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "Apolles | Login",
  description: "Secure access to your Apolles workspace",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-[#0A2540] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#635BFF]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-6 text-white"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-white">Apolles</span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight text-white text-balance">
            Streamlined hotel booking for travel professionals
          </h1>
          <p className="max-w-md text-base leading-relaxed text-[#8B9DB5]">
            Manage reservations, access exclusive rates, and deliver exceptional service to your clients - all from one powerful platform.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#5E7A9A]">
          <Shield className="size-4" />
          <span>Enterprise-grade security</span>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center bg-[#F6F9FC] px-6 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#635BFF]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-6 text-white"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-[#0A2540]">Apolles</span>
          </div>

          <div className="rounded-xl border border-[#E3E8EF] bg-white p-8 shadow-sm">
            <div className="mb-6 space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-[#0A2540]">
                Sign in to your account
              </h2>
              <p className="text-sm text-[#5E6D82]">
                Enter your credentials to access your workspace
              </p>
            </div>

            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-[#8B9DB5]">
            Need access? Contact your organization administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
