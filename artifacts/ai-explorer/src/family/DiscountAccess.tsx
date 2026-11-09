import { useEffect, useRef, useState, type FormEvent } from "react";
import { useUser } from "@clerk/react";
import {
  getGetFamilyQueryKey,
  getListDiscountCodesQueryKey,
  useCreateDiscountCode,
  useListDiscountCodes,
  useRedeemDiscountCode,
  useSetDiscountCodeActive,
} from "@workspace/api-client-react";
import type { FamilyAccess } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Gift, Plus, ShieldCheck } from "lucide-react";

const PENDING_CODE_KEY = "ltb-pending-family-access-code";

function DiscountCodeForm({ alreadyHasAccess = false }: { alreadyHasAccess?: boolean }) {
  const { isSignedIn } = useUser();
  const queryClient = useQueryClient();
  const redeemCode = useRedeemDiscountCode();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const autoRedeemStarted = useRef(false);

  const redeem = (value: string, clearInput: boolean) => {
    setError("");
    setMessage("");
    redeemCode.mutate({ data: { code: value } }, {
      onSuccess: () => {
        if (clearInput) setCode("");
        sessionStorage.removeItem(PENDING_CODE_KEY);
        setMessage("Full family access is unlocked. This access stays with your family account.");
        void queryClient.invalidateQueries({ queryKey: getGetFamilyQueryKey() });
      },
      onError: () => setError("That code could not be used. Check it and try again, or ask the person who shared it."),
    });
  };

  useEffect(() => {
    if (!isSignedIn || alreadyHasAccess || autoRedeemStarted.current) return;
    const pending = sessionStorage.getItem(PENDING_CODE_KEY);
    if (!pending) return;
    autoRedeemStarted.current = true;
    setCode(pending);
    redeem(pending, true);
  }, [isSignedIn, alreadyHasAccess]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (normalized.length < 4 || normalized.length > 32) {
      setError("Enter a code that is 4 to 32 characters long.");
      return;
    }
    setError("");
    if (!isSignedIn) {
      sessionStorage.setItem(PENDING_CODE_KEY, normalized);
      setCode(normalized);
      setMessage("Code saved. Create your parent account below and we’ll unlock access when you arrive at your family dashboard.");
      return;
    }
    redeem(normalized, true);
  };

  if (alreadyHasAccess) return null;
  return (
    <section className="discount-code-card" aria-labelledby="discount-code-heading">
      <div className="discount-code-heading">
        <span className="discount-code-icon"><Gift size={18} /></span>
        <div><h3 id="discount-code-heading">Have a family access code?</h3><p>Enter a code shared with your family to unlock the full program.</p></div>
      </div>
      <form className="discount-code-form" onSubmit={submit}>
        <label className="sr-only" htmlFor="family-access-code">Access code</label>
        <input
          id="family-access-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={32}
          placeholder="Enter code"
          aria-describedby={error ? "family-access-code-error" : message ? "family-access-code-message" : undefined}
          data-testid="input-family-access-code"
        />
        <button className="secondary-button" type="submit" disabled={redeemCode.isPending} data-testid="button-redeem-access-code">
          {redeemCode.isPending ? "Checking…" : "Redeem code"}
        </button>
      </form>
      {error && <p className="discount-code-error" role="alert" id="family-access-code-error">{error}</p>}
      {message && <p className="discount-code-message" role="status" id="family-access-code-message">{message}</p>}
      {!isSignedIn && <p className="discount-code-hint">A parent account is needed to attach access to your family.</p>}
    </section>
  );
}

export function FamilyAccessCard({ access }: { access: FamilyAccess }) {
  if (!access.freeAccess) return <DiscountCodeForm />;
  return (
    <section className="family-access-card" aria-label="Free family access" data-testid="family-free-access">
      <div className="family-access-mark"><CheckCircle2 size={19} /></div>
      <div>
        <strong>Full program access unlocked</strong>
        <p>Code <b>{access.code}</b>{access.label ? ` · ${access.label}` : ""} · {access.discountPercent}% discount</p>
        <span>This access is attached to your family account and remains free when paid checkout is introduced.</span>
      </div>
    </section>
  );
}

export function SignUpDiscountCode() {
  return <DiscountCodeForm />;
}

export function DiscountCodeAdminPanel() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useListDiscountCodes();
  const createCode = useCreateDiscountCode();
  const setActive = useSetDiscountCodeActive();
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [discountPercent, setDiscountPercent] = useState("100");
  const [useLimit, setUseLimit] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: getListDiscountCodesQueryKey() });
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const trimmedLabel = label.trim();
    const normalizedCode = code.trim().toUpperCase();
    const parsedPercent = Number(discountPercent);
    if (normalizedCode.length < 4 || !trimmedLabel || !Number.isInteger(parsedPercent) || parsedPercent < 0 || parsedPercent > 100) {
      setError("Add a code of at least 4 characters, a label, and a discount from 0 to 100%.");
      return;
    }
    const parsedLimit = useLimit.trim() ? Number(useLimit) : undefined;
    if (parsedLimit !== undefined && (!Number.isInteger(parsedLimit) || parsedLimit < 1)) {
      setError("The use limit must be a whole number greater than zero.");
      return;
    }
    const expiry = expiresOn ? new Date(`${expiresOn}T23:59:59.999`).toISOString() : undefined;
    createCode.mutate({
      data: {
        code: normalizedCode,
        label: trimmedLabel,
        discountPercent: parsedPercent,
        ...(parsedLimit === undefined ? {} : { useLimit: parsedLimit }),
        ...(expiry ? { expiresAt: expiry } : {}),
      },
    }, {
      onSuccess: () => {
        setCode("");
        setLabel("");
        setDiscountPercent("100");
        setUseLimit("");
        setExpiresOn("");
        setMessage("Access code created.");
        refresh();
      },
      onError: () => setError("Could not create that code. It may already exist; try a different code word."),
    });
  };
  const toggle = (codeId: string, active: boolean) => {
    setError("");
    setActive.mutate({ codeId, data: { active } }, {
      onSuccess: refresh,
      onError: () => setError("Could not update that code. Please try again."),
    });
  };

  return (
    <section className="family-panel discount-admin-panel" aria-labelledby="discount-admin-heading" data-testid="discount-code-admin">
      <div className="panel-head">
        <div><div className="eyebrow">Owner tools</div><h2 id="discount-admin-heading">Family access codes</h2></div>
        <ShieldCheck size={20} aria-hidden="true" />
      </div>
      <p className="discount-admin-intro">Create invitation codes for families. Redeeming any code grants full access that stays attached to that family account.</p>
      <form className="discount-admin-form" onSubmit={submit}>
        <label>Code word<input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} autoComplete="off" maxLength={32} placeholder="FRIEND-ACCESS" required /></label>
        <label>Who it’s for<input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={100} placeholder="Family or invitation note" required /></label>
        <div className="discount-admin-fields">
          <label>Discount %<input type="number" value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} min="0" max="100" step="1" required /></label>
          <label>Use limit<input type="number" value={useLimit} onChange={(event) => setUseLimit(event.target.value)} min="1" step="1" placeholder="No limit" /></label>
          <label>Expires on<input type="date" value={expiresOn} onChange={(event) => setExpiresOn(event.target.value)} /></label>
        </div>
        <button className="primary-button" type="submit" disabled={createCode.isPending}><Plus size={15} /> {createCode.isPending ? "Creating…" : "Create code"}</button>
      </form>
      {error && <p className="discount-code-error" role="alert">{error}</p>}
      {message && <p className="discount-code-message" role="status">{message}</p>}
      <div className="discount-code-list">
        <h3>Existing codes</h3>
        {isLoading ? <p>Loading codes…</p> : isError ? <p role="alert">Could not load codes. <button type="button" className="inline-button" onClick={() => void refetch()}>Try again</button></p> : data?.codes.length ? data.codes.map((item) => (
          <div className="discount-code-row" key={item.id}>
            <div><strong>{item.code}</strong><span>{item.label} · {item.discountPercent}% off · {item.redeemedCount}{item.useLimit === null ? "" : `/${item.useLimit}`} used</span>
              {item.expiresAt && <small>Expires {new Date(item.expiresAt).toLocaleDateString()}</small>}
            </div>
            <button type="button" className="secondary-button" disabled={setActive.isPending} onClick={() => toggle(item.id, !item.active)}>{item.active ? "Disable" : "Enable"}</button>
          </div>
        )) : <p>No access codes yet.</p>}
      </div>
    </section>
  );
}
