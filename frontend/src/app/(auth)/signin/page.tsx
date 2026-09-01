import { LoginForm } from "@/components/login-form"
import { BrandMark } from "@/components/brand-mark"

export default function SigninPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-accent/40 to-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <BrandMark className="mx-auto" textClassName="text-xl" />
        <LoginForm />
      </div>
    </div>
  )
}
