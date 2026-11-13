import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MailPlus, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { EmptyRows, PageHeader } from "@/components/ui/page";
import { api } from "@/lib/api";

type Membership = {
  id: string;
  role: string;
  isActive: boolean;
  user: {
    fullName: string;
    email: string;
    phone?: string;
    lastLoginAt?: string;
    isActive: boolean;
  };
};
const roles = [
  "DOCTOR",
  "RECEPTIONIST",
  "INVENTORY_MANAGER",
  "PHARMACIST",
  "NURSE",
  "ACCOUNTANT",
  "STAFF",
  "AUDITOR",
];
export function UsersPage() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("STAFF");
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["clinic-users"],
    queryFn: () => api<Membership[]>("/users"),
  });
  const invite = useMutation({
    mutationFn: () =>
      api("/users/invitations", {
        method: "POST",
        body: JSON.stringify({ email, fullName, role }),
      }),
    onSuccess: () => {
      toast.success("Invitation sent");
      setOpen(false);
      setEmail("");
      setFullName("");
      void client.invalidateQueries({ queryKey: ["clinic-users"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: ["clinic-users"] }),
    onError: (error) => toast.error(error.message),
  });
  return (
    <>
      <PageHeader
        title="Users & roles"
        description="Invite clinic staff and control account access."
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <MailPlus size={16} />
            Invite user
          </button>
        }
      />
      <section className="card mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Last login</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {query.data?.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-semibold text-slate-900">
                      {row.user.fullName}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {row.user.email}
                    </div>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      <ShieldCheck size={12} />
                      {row.role.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td>
                    {row.user.lastLoginAt
                      ? new Date(row.user.lastLoginAt).toLocaleString("en-PH")
                      : "Never"}
                  </td>
                  <td>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      disabled={row.role === "CLINIC_OWNER" || toggle.isPending}
                      onClick={() =>
                        toggle.mutate({ id: row.id, isActive: !row.isActive })
                      }
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium ${row.isActive ? "text-rose-600 hover:bg-rose-50" : "text-emerald-700 hover:bg-emerald-50"}`}
                    >
                      {row.isActive ? (
                        <UserX size={14} />
                      ) : (
                        <UserCheck size={14} />
                      )}
                      {row.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {!query.data?.length && (
                <EmptyRows
                  columns={5}
                  loading={query.isLoading}
                  label="No clinic users found."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite clinic user"
        description="Supabase will email a secure account activation link."
      >
        <div className="space-y-4">
          <label>
            <span className="field-label">Full name</span>
            <input
              className="field"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>
          <label>
            <span className="field-label">Email</span>
            <input
              type="email"
              className="field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            <span className="field-label">Role</span>
            <select
              className="field"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              disabled={
                fullName.length < 2 || !email.includes("@") || invite.isPending
              }
              onClick={() => invite.mutate()}
            >
              {invite.isPending ? "Sending…" : "Send invitation"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
