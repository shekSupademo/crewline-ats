import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Dropdown } from "../components/Dropdown";
import {
  Avatar,
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Panel,
  Tabs,
  Toggle,
} from "../components/ui";
import type { Role } from "../data/types";
import { uid } from "../lib/format";
import { useDispatch, useStore } from "../state/store";
import { useToast } from "../state/toast";

const roleOptions = (["admin", "recruiter", "interviewer"] as const).map(
  (r) => ({ value: r, label: r[0].toUpperCase() + r.slice(1) }),
);

export function Settings() {
  const { settings, members } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const [tab, setTab] = useState<
    "company" | "team" | "notifications" | "templates"
  >("company");
  const [name, setName] = useState(settings.companyName);
  const [template, setTemplate] = useState(settings.rejectTemplate);
  const [invite, setInvite] = useState(false);
  const [inv, setInv] = useState({
    name: "",
    email: "",
    role: "interviewer" as Role,
  });
  const [tried, setTried] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const admins = members.filter((m) => m.role === "admin").length;
  const invErr = {
    name: !inv.name.trim() ? "Enter a name" : undefined,
    email: !/^\S+@\S+\.\S+$/.test(inv.email)
      ? "Enter a valid email"
      : members.some((m) => m.email === inv.email)
        ? "Already on the team"
        : undefined,
  };

  return (
    <>
      <PageHeader title="Settings" />
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "company", label: "Company" },
          { value: "team", label: "Team", count: members.length },
          { value: "notifications", label: "Notifications" },
          { value: "templates", label: "Email templates" },
        ]}
      />
      <div className="mt-6 max-w-3xl space-y-6">
        {tab === "company" && (
          <>
            <Panel title="Profile">
              <form
                className="flex items-end gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  dispatch({
                    type: "settings/update",
                    patch: { companyName: name.trim() || settings.companyName },
                  });
                  toast("Company name saved");
                }}
              >
                <Field label="Company name">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    name="companyName"
                  />
                </Field>
                <Button type="submit" variant="primary">
                  Save
                </Button>
              </form>
              <div className="mt-4 w-48">
                <Field label="Theme">
                  <Dropdown
                    label="Theme"
                    value={settings.theme}
                    searchable={false}
                    onChange={(t) =>
                      dispatch({ type: "settings/update", patch: { theme: t } })
                    }
                    options={[
                      { value: "light", label: "Light" },
                      { value: "dark", label: "Dark" },
                      { value: "system", label: "System" },
                    ]}
                    testId="theme-select"
                  />
                </Field>
              </div>
            </Panel>
            <Panel title="Demo data">
              <p className="mb-3 text-sm text-zinc-500">
                Restore every job, candidate and interview to the original
                sample data.
              </p>
              <Button
                variant="danger"
                onClick={() => setConfirmReset(true)}
                data-testid="reset-data"
              >
                Reset demo data
              </Button>
            </Panel>
          </>
        )}
        {tab === "team" && (
          <Panel
            title="Members"
            action={
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setInvite(true);
                  setTried(false);
                }}
                data-testid="invite-member"
              >
                Invite
              </Button>
            }
            padded={false}
          >
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {members.map((m) => {
                const lastAdmin = m.role === "admin" && admins === 1;
                return (
                  <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={m.name} size="sm" />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-medium">{m.name}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {m.email} · {m.title}
                      </p>
                    </div>
                    <Dropdown
                      label={`Role for ${m.name}`}
                      className="w-36"
                      value={m.role}
                      searchable={false}
                      options={roleOptions}
                      onChange={(r) => {
                        if (lastAdmin && r !== "admin")
                          return toast("A workspace needs at least one admin");
                        dispatch({ type: "member/setRole", id: m.id, role: r });
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Remove ${m.name}`}
                      disabled={lastAdmin}
                      title={
                        lastAdmin ? "Can't remove the last admin" : undefined
                      }
                      onClick={() => {
                        dispatch({ type: "member/remove", id: m.id });
                        toast(`${m.name} removed`);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}
        {tab === "notifications" && (
          <Panel title="Email me when">
            <ul className="space-y-4 text-sm">
              {(
                [
                  [
                    "notifyNewApplicant",
                    "A new candidate applies to a job I manage",
                  ],
                  ["notifyScorecard", "An interviewer submits a scorecard"],
                  ["notifyDigest", "Weekly pipeline digest (Mondays)"],
                ] as const
              ).map(([k, label]) => (
                <li key={k} className="flex items-center justify-between gap-4">
                  <span>{label}</span>
                  <Toggle
                    label={label}
                    testId={`toggle-${k}`}
                    checked={settings[k]}
                    onChange={(v) => {
                      dispatch({ type: "settings/update", patch: { [k]: v } });
                      toast("Preference saved");
                    }}
                  />
                </li>
              ))}
            </ul>
          </Panel>
        )}
        {tab === "templates" && (
          <Panel title="Rejection email">
            <p className="mb-2 text-xs text-zinc-500">
              Variables: {"{{first_name}}"}, {"{{job_title}}"}, {"{{sender}}"}
            </p>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={8}
              aria-label="Rejection email template"
              data-testid="template-editor"
              className="w-full rounded-lg border border-zinc-200 bg-white p-3 font-mono text-xs outline-none focus:border-teal-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button
                onClick={() => setTemplate(settings.rejectTemplate)}
                disabled={template === settings.rejectTemplate}
              >
                Discard
              </Button>
              <Button
                variant="primary"
                disabled={
                  template === settings.rejectTemplate ||
                  !template.includes("{{first_name}}")
                }
                onClick={() => {
                  dispatch({
                    type: "settings/update",
                    patch: { rejectTemplate: template },
                  });
                  toast("Template saved");
                }}
              >
                Save template
              </Button>
            </div>
            {!template.includes("{{first_name}}") && (
              <p className="mt-2 text-xs text-rose-600">
                The template must include {"{{first_name}}"}.
              </p>
            )}
          </Panel>
        )}
      </div>

      <Modal
        open={invite}
        onClose={() => setInvite(false)}
        title="Invite teammate"
        testId="invite-modal"
        footer={
          <>
            <Button onClick={() => setInvite(false)}>Cancel</Button>
            <Button
              variant="primary"
              data-testid="invite-submit"
              onClick={() => {
                setTried(true);
                if (invErr.name || invErr.email) return;
                dispatch({
                  type: "member/invite",
                  member: {
                    id: uid("m"),
                    name: inv.name.trim(),
                    email: inv.email,
                    role: inv.role,
                    title: "Invited",
                  },
                });
                toast(`Invite sent to ${inv.email}`);
                setInv({ name: "", email: "", role: "interviewer" });
                setInvite(false);
              }}
            >
              Send invite
            </Button>
          </>
        }
      >
        <Field label="Name" error={tried ? invErr.name : undefined}>
          <Input
            value={inv.name}
            onChange={(e) => setInv({ ...inv, name: e.target.value })}
          />
        </Field>
        <Field label="Email" error={tried ? invErr.email : undefined}>
          <Input
            type="email"
            value={inv.email}
            onChange={(e) => setInv({ ...inv, email: e.target.value })}
          />
        </Field>
        <Field label="Role">
          <Dropdown
            label="Role"
            value={inv.role}
            searchable={false}
            options={roleOptions}
            onChange={(r) => setInv({ ...inv, role: r })}
          />
        </Field>
      </Modal>
      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset demo data?"
        footer={
          <>
            <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button
              variant="danger"
              data-testid="reset-confirm"
              onClick={() => {
                dispatch({ type: "reset" });
                setConfirmReset(false);
                setName("Crewline");
                toast("Demo data restored");
              }}
            >
              Reset
            </Button>
          </>
        }
      >
        <p className="text-sm">Every change you made is lost.</p>
      </Modal>
    </>
  );
}
