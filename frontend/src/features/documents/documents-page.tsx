import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileCheck2, FileUp, LockKeyhole } from "lucide-react";
import { useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";

type DocumentRow = {
  id: string;
  originalName: string;
  contentType: string;
  category: string;
  status: string;
  sizeBytes: string | null;
  createdAt: string;
};
type UploadTicket = { document: DocumentRow; upload: { signedUrl: string } };

export function DocumentsPage() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patientId") ?? undefined;
  const appointmentId = searchParams.get("appointmentId") ?? undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState(
    patientId ? "medical-record" : "inventory-evidence",
  );
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api<DocumentRow[]>("/documents"),
  });
  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 25 * 1024 * 1024)
        throw new Error("File exceeds the 25 MB limit");
      const ticket = await api<UploadTicket>("/documents/uploads", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          category,
          patientId,
          appointmentId,
        }),
      });
      const response = await fetch(ticket.upload.signedUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Secure upload failed");
      const checksum = Array.from(
        new Uint8Array(
          await crypto.subtle.digest("SHA-256", await file.arrayBuffer()),
        ),
      )
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      return api<DocumentRow>(`/documents/${ticket.document.id}/finalize`, {
        method: "POST",
        body: JSON.stringify({ sizeBytes: file.size, checksum }),
      });
    },
    onSuccess: async () => {
      toast.success("Document uploaded and queued for security scanning");
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Upload failed"),
  });
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="label">Secure storage</div>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-[-.035em]">
            Documents
          </h2>
          <p className="mt-1 text-sm text-[#71807c]">
            {patientId
              ? "Upload directly into this patient's longitudinal record."
              : "Tenant-isolated evidence with signed access and quarantine scanning."}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="field w-auto"
          >
            <option value="medical-record">Medical record</option>
            <option value="lab-report">Lab report</option>
            <option value="vaccination">Vaccination</option>
            <option value="insurance">Insurance</option>
            <option value="prescription">Prescription</option>
            <option value="invoice">Invoice</option>
            <option value="inventory-evidence">Inventory evidence</option>
            <option value="supplier-certificate">Supplier certificate</option>
            <option value="other">Other</option>
          </select>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="btn-primary"
          >
            <FileUp size={15} />
            {upload.isPending ? "Uploading…" : "Upload"}
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.docx"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload.mutate(file);
              event.target.value = "";
            }}
          />
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#d7e7dd] bg-[#edf6f0] px-4 py-3 text-xs text-[#416854]">
        <LockKeyhole size={15} />
        Downloads become available only after the malware scanner marks an
        upload as safe.
      </div>
      <section className="card mt-4 divide-y divide-line">
        {data.length ? (
          data.map((document) => (
            <div
              key={document.id}
              className="flex items-center gap-3 px-5 py-4"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-paper text-pine">
                <FileCheck2 size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold">
                  {document.originalName}
                </div>
                <div className="mt-1 text-[10px] text-[#82908b]">
                  {document.category.replaceAll("-", " ")} ·{" "}
                  {new Date(document.createdAt).toLocaleDateString("en-PH")}
                </div>
              </div>
              <StatusBadge
                tone={
                  document.status === "AVAILABLE"
                    ? "healthy"
                    : document.status === "REJECTED"
                      ? "danger"
                      : "warning"
                }
              >
                {document.status.replaceAll("_", " ")}
              </StatusBadge>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-xs text-[#82908b]">
            No documents have been uploaded.
          </div>
        )}
      </section>
    </div>
  );
}
