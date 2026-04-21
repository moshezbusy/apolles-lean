"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"

type ErrorType = "none" | "invalid-credentials" | "inactive-account"

interface LoginFormProps {
  initialError?: ErrorType
}

export function LoginForm({ initialError = "none" }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ErrorType>(initialError)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("none")
    
    // Simulate login - in production this would call your auth API
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Demo: cycle through error states for demonstration
    if (email === "invalid@example.com") {
      setError("invalid-credentials")
    } else if (email === "inactive@example.com") {
      setError("inactive-account")
    } else {
      // Success case would redirect
      setError("none")
    }
    
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Messages */}
      {error === "invalid-credentials" && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-900">Invalid credentials</p>
            <p className="text-sm text-red-700">
              The email or password you entered is incorrect. Please try again.
            </p>
          </div>
        </div>
      )}

      {error === "inactive-account" && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-900">Account inactive</p>
            <p className="text-sm text-amber-700">
              Your account has been deactivated. Please contact your administrator for assistance.
            </p>
          </div>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[#111827]">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-11 border-[#E5E7EB] bg-white text-[#111827] placeholder:text-[#9CA8B8] focus-visible:border-[#7C5CFF] focus-visible:ring-[#7C5CFF]/20"
        />
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-[#111827]">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-11 border-[#E5E7EB] bg-white pr-10 text-[#111827] placeholder:text-[#9CA8B8] focus-visible:border-[#7C5CFF] focus-visible:ring-[#7C5CFF]/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] transition-colors hover:text-[#111827]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="h-11 w-full bg-[#7C5CFF] text-white hover:bg-[#5851EA] focus-visible:ring-[#7C5CFF]/30"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  )
}
