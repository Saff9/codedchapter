import { SignUp } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignUpPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-secondary/15 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-xs font-mono text-primary mb-3">// chapter_one.ts</div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Start your chapter
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Join and be part of the conversation.
          </p>
        </div>

        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm",
              card: "bg-card border border-border shadow-xl rounded-xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "border-border bg-muted/40 text-foreground hover:bg-muted transition-colors text-sm",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground text-xs",
              formFieldLabel: "text-foreground text-sm font-medium",
              formFieldInput: "bg-background border-border text-foreground text-sm rounded-lg focus:ring-primary",
              footerActionText: "text-muted-foreground text-sm",
              footerActionLink: "text-primary hover:text-primary/80 font-medium text-sm",
            },
          }}
        />
      </div>
    </div>
  );
}
