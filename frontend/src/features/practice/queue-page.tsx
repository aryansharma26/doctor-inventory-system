import { useMutation, useQueryClient } from "@tanstack/react-query";
import { endOfDay, format, startOfDay } from "date-fns";
import {
  CheckCircle2,
  Clock3,
  Play,
  RefreshCw,
  Stethoscope,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { practiceKeys, useAppointments } from "./practice-queries";
import type { Appointment, AppointmentStatus } from "./types";

const nextAction: Partial<
  Record<
    AppointmentStatus,
    { status: AppointmentStatus; label: string; icon: typeof Play }
  >
> = {
  BOOKED: { status: "CHECKED_IN", label: "Check in", icon: UserCheck },
  CONFIRMED: { status: "CHECKED_IN", label: "Check in", icon: UserCheck },
  CHECKED_IN: { status: "IN_CONSULTATION", label: "Start visit", icon: Play },
  IN_CONSULTATION: {
    status: "COMPLETED",
    label: "Complete",
    icon: CheckCircle2,
  },
};

export function QueuePage() {
  const today = new Date();
  const query = useAppointments(startOfDay(today), endOfDay(today));
  const client = useQueryClient();
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api(`/practice/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast.success("Queue updated");
      void client.invalidateQueries({ queryKey: practiceKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });
  const active =
    query.data?.filter(
      (row) => !["CANCELLED", "NO_SHOW"].includes(row.status),
    ) ?? [];
  const waiting = active.filter((row) => row.status === "CHECKED_IN");
  const consulting = active.filter((row) => row.status === "IN_CONSULTATION");
  const upcoming = active.filter((row) =>
    ["BOOKED", "CONFIRMED"].includes(row.status),
  );
  const completed = active.filter((row) => row.status === "COMPLETED");

  return (
    <div>
      <PageHeader
        title="Daily queue"
        description={`${format(today, "EEEE, d MMMM yyyy")} · Live patient flow for all doctors.`}
        action={
          <button
            className="btn-secondary"
            onClick={() => void query.refetch()}
          >
            <RefreshCw
              size={16}
              className={cn(query.isFetching && "animate-spin")}
            />
            Refresh
          </button>
        }
      />
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Metric
          label="Scheduled"
          value={active.length}
          tone="bg-blue-50 text-blue-700"
        />
        <Metric
          label="Waiting"
          value={waiting.length}
          tone="bg-amber-50 text-amber-700"
        />
        <Metric
          label="In consultation"
          value={consulting.length}
          tone="bg-violet-50 text-violet-700"
        />
        <Metric
          label="Completed"
          value={completed.length}
          tone="bg-emerald-50 text-emerald-700"
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_1.05fr_.9fr]">
        <QueueColumn
          title="Waiting room"
          subtitle="Patients who have checked in"
          rows={waiting}
          empty="No patients waiting."
          update={(id, status) => update.mutate({ id, status })}
        />
        <QueueColumn
          title="With doctor"
          subtitle="Consultations in progress"
          rows={consulting}
          empty="No active consultations."
          update={(id, status) => update.mutate({ id, status })}
        />
        <section className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h3 className="font-semibold text-slate-900">Coming up</h3>
            <p className="mt-1 text-xs text-slate-500">
              Appointments later today
            </p>
          </div>
          <div className="divide-y divide-line">
            {upcoming.map((row) => (
              <QueueRow
                key={row.id}
                row={row}
                compact
                update={(id, status) => update.mutate({ id, status })}
              />
            ))}
            {!upcoming.length && <Empty label="No upcoming appointments." />}
          </div>
        </section>
      </div>
      <section className="card mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              Today's completed visits
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Finished consultations remain visible for front-desk confirmation.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {completed.length} complete
          </span>
        </div>
        <div className="divide-y divide-line">
          {completed.map((row) => (
            <QueueRow key={row.id} row={row} compact update={() => undefined} />
          ))}
          {!completed.length && (
            <Empty label="Completed visits will appear here." />
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <article className="card flex items-center gap-4 p-4">
      <span className={cn("grid size-11 place-items-center rounded-xl", tone)}>
        <UsersRound size={20} />
      </span>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </article>
  );
}

function QueueColumn({
  title,
  subtitle,
  rows,
  empty,
  update,
}: {
  title: string;
  subtitle: string;
  rows: Appointment[];
  empty: string;
  update: (id: string, status: AppointmentStatus) => void;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="divide-y divide-line">
        {rows.map((row) => (
          <QueueRow key={row.id} row={row} update={update} />
        ))}
        {!rows.length && <Empty label={empty} />}
      </div>
    </section>
  );
}

function QueueRow({
  row,
  compact = false,
  update,
}: {
  row: Appointment;
  compact?: boolean;
  update: (id: string, status: AppointmentStatus) => void;
}) {
  const action = nextAction[row.status];
  const ActionIcon = action?.icon;
  return (
    <article className="p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {row.patient.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-900">
            {row.patient.name}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Clock3 size={11} />
              {format(new Date(row.startsAt), "h:mm a")}
            </span>
            <span className="flex items-center gap-1">
              <Stethoscope size={11} />
              Dr. {row.doctor.user.fullName}
            </span>
          </div>
          {row.reason && !compact && (
            <p className="mt-2 line-clamp-2 text-xs text-slate-500">
              {row.reason}
            </p>
          )}
        </div>
      </div>
      {action && ActionIcon && (
        <button
          className="btn-primary mt-3 w-full py-2! text-xs!"
          onClick={() => update(row.id, action.status)}
        >
          <ActionIcon size={14} />
          {action.label}
        </button>
      )}
    </article>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="p-8 text-center text-xs text-slate-400">{label}</div>;
}
