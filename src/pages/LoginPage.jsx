import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import eyeClose from "@/assets/login/eyeclose.svg";
import eyeOpen from "@/assets/login/eyeopen.svg";
import loginBackground from "@/assets/login/loginbackground.png";
import loginPanelTop from "@/assets/login/loginpaneltop.svg";
import LanguageMenu from "@/components/LanguageMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("errors.required");
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/overview", { replace: true });
    } catch (requestError) {
      const apiMessage =
        requestError.response?.data?.errorMessage ||
        requestError.response?.data?.message;
      setError(
        apiMessage === "Invalid credentials"
          ? "errors.invalid"
          : "errors.signIn",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-svh overflow-hidden">
      <div className="absolute top-4 right-4 z-10">
        <LanguageMenu />
      </div>
      <img
        src={loginBackground}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col items-center justify-center gap-8 px-5 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <h1 className="max-w-md text-center font-plex text-[32px] leading-[40px] font-semibold tracking-[0.02em] text-white lg:text-left">
          <span className="block">{t("login.welcomeLead")}</span>
          <span className="block">{t("login.welcomeRest")}</span>
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex h-[326px] w-[360px] shrink-0 rotate-0 flex-col overflow-hidden rounded-[8px] bg-white opacity-100 shadow-2xl"
          noValidate
        >
          <img
            src={loginPanelTop}
            alt="kloudspot"
            className="block h-[110px] w-full object-cover"
          />

          <div className="flex flex-1 flex-col justify-center gap-4 px-6">
            <div className="flex flex-col gap-5">
              <div className="relative w-[312px]">
                <Input
                  id="login-id"
                  name="username"
                  type="email"
                  autoComplete="email"
                  placeholder={t("login.emailPlaceholder")}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(error)}
                  className="h-[44px] w-[312px] rotate-0 rounded-[2px] border border-[1px] border-solid border-[#0D0D0D1A] bg-white px-3 py-[10px] text-sm opacity-100 shadow-none"
                />
                <label
                  htmlFor="login-id"
                  className="absolute top-0 left-3 -translate-y-1/2 bg-white px-1 font-plex text-[12px] leading-[24px] font-medium tracking-[-0.44px] text-neutral-800"
                >
                  {t("login.id")} <span className="text-red-600">*</span>
                </label>
              </div>

              <div className="relative w-[312px]">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={t("login.passwordPlaceholder")}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(error)}
                  className="h-[44px] w-[312px] rotate-0 rounded-[2px] border border-[1px] border-solid border-[#0D0D0D1A] bg-white py-[10px] pr-10 pl-3 text-sm opacity-100 shadow-none"
                />
                <label
                  htmlFor="password"
                  className="absolute top-0 left-3 -translate-y-1/2 bg-white px-1 font-plex text-[12px] leading-[24px] font-medium tracking-[-0.44px] text-neutral-800"
                >
                  {t("login.password")} <span className="text-red-600">*</span>
                </label>
                <button
                  type="button"
                  className="absolute top-1/2 right-3 -translate-y-1/2"
                  aria-label={
                    showPassword
                      ? t("login.hidePassword")
                      : t("login.showPassword")
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <img
                    src={showPassword ? eyeClose : eyeOpen}
                    alt=""
                    className="size-5"
                  />
                </button>
              </div>
            </div>

            {error ? (
              <p role="alert" className="text-sm text-red-600">
                {t(error)}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={submitting}
              className="h-[42px] w-[312px] rotate-0 gap-4 rounded-[8px] border-0 bg-[#009490] px-5 py-[10px] font-plex text-[16px] leading-[16px] font-normal tracking-[0.44px] text-white capitalize opacity-100 shadow-none transition-none duration-0 hover:bg-[#009490] active:translate-y-0"
            >
              {submitting ? t("login.submitting") : t("login.submit")}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
