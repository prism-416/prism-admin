"use client";

import { Field, Input, Label, Textarea } from "@/atomics";
import { cn } from "@/shared/utils/cn";

import { INTERNAL_SCOPE_DETAILS, INTERNAL_SCOPES, type InternalScope } from "../types";

export function ReasonField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Field
      label="Audit reason"
      description="Stored with the admin audit event. Keep it concise; the API limit is 500 characters."
    >
      <Textarea
        value={value}
        maxLength={500}
        onChange={event => onChange(event.target.value)}
        placeholder="Why is this admin change being made?"
      />
      <p className="text-right text-xs text-prism-muted">{value.length}/500</p>
    </Field>
  );
}

export function ExpirationField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Field
      label="Expires at"
      description="Use a future date. The value is sent as an ISO date-time."
    >
      <Input
        type="datetime-local"
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </Field>
  );
}

export function ScopePicker({
  value,
  onChange,
}: {
  value: InternalScope[];
  onChange: (value: InternalScope[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Scopes</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {INTERNAL_SCOPES.map(scope => {
          const checked = value.includes(scope);
          const detail = INTERNAL_SCOPE_DETAILS[scope];

          return (
            <label
              key={scope}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-prism-surface-field px-3 py-2 text-sm text-prism-body transition",
                checked && "border-prism-teal-500/30 bg-prism-teal-500/10 text-prism-navy",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={event => {
                  if (event.target.checked) {
                    onChange([...value, scope]);
                    return;
                  }

                  onChange(value.filter(item => item !== scope));
                }}
                className="mt-1 size-4 shrink-0 accent-prism-teal-500"
              />
              <span className="min-w-0">
                <span className="block font-medium text-prism-heading">{detail.label}</span>
                <span className="block break-words font-mono text-xs text-prism-muted">{scope}</span>
                <span className="mt-1 block text-xs leading-5 text-prism-muted">{detail.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function toIsoDateTimeInput(daysFromNow = 30) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setSeconds(0, 0);
  return date.toISOString().slice(0, 16);
}

export function fromDateTimeInput(value: string) {
  return new Date(value).toISOString();
}
