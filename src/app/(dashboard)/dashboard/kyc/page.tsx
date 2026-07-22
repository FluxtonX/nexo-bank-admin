"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RequirePermission } from "@/components/layout/RequirePermission";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Search,
  ShieldCheck,
  X,
  XCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Check,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  ZoomIn,
  CreditCard,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { USERS_DATA, type AdminUser, type RiskLevel } from "@/lib/data/users";
import { supabase } from "@/lib/supabase";

type ReviewStatus = "Pending" | "Under Review" | "Approved" | "Rejected";
type TabValue = "all" | ReviewStatus;

type KycRequest = {
  requestId: string;
  user: any;
  documentType: string;
  documents: Array<"verified" | "missing" | "flagged">;
  status: ReviewStatus;
  submitted: string;
  rawImages?: { front: string; back: string; selfie: string; };
};

const BRAND_GRADIENT = "linear-gradient(135deg, #0A3D91 0%, #1650AB 100%)";

const INITIAL_REQUESTS: KycRequest[] = [
  {
    requestId: "KYC-2024-543",
    user: USERS_DATA.find((u) => u.id === "USR-2024-12456") || USERS_DATA[2],
    documentType: "Driver's License",
    documents: ["verified", "verified", "verified"],
    status: "Pending",
    submitted: "Jun 1, 2026, 02:30 p.m.",
  },
  {
    requestId: "KYC-2024-542",
    user: USERS_DATA.find((u) => u.id === "USR-2024-12455") || USERS_DATA[3],
    documentType: "Passport",
    documents: ["verified", "verified", "flagged"],
    status: "Under Review",
    submitted: "May 30, 2026, 10:15 a.m.",
  },
  {
    requestId: "KYC-2024-541",
    user: {
      ...(USERS_DATA.find((u) => u.id === "USR-2024-12452") || USERS_DATA[6]),
      id: "USR-2024-12454", // Override to match mockup exactly
    },
    documentType: "Driver's License",
    documents: ["verified", "verified", "verified"],
    status: "Pending",
    submitted: "May 29, 2026, 04:45 p.m.",
  },
];

const TABS: Array<{ label: string; value: TabValue }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "Pending" },
  { label: "Under Review", value: "Under Review" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
];

function StatusBadge({ status }: { status: ReviewStatus }) {
  const map: Record<ReviewStatus, { cls: string; icon: React.ReactNode }> = {
    Pending: { cls: "bg-amber-50 text-amber-600 border-amber-200", icon: <Clock className="h-3.5 w-3.5" /> },
    "Under Review": { cls: "bg-blue-50 text-blue-700 border-blue-200", icon: <Eye className="h-3.5 w-3.5" /> },
    Approved: { cls: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    Rejected: { cls: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="h-3.5 w-3.5" /> },
  };
  const style = map[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", style.cls)}>
      {style.icon}
      {status}
    </span>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const map: Record<RiskLevel, string> = {
    "Low Risk": "bg-green-50 text-green-700 border-green-200",
    "Medium Risk": "bg-amber-50 text-amber-700 border-amber-200",
    "High Risk": "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", map[level])}>
      {level === "High Risk" && <AlertTriangle className="h-3.5 w-3.5" />}
      {level}
    </span>
  );
}

function DocumentDots({ docs }: { docs: KycRequest["documents"] }) {
  return (
    <div className="flex items-center gap-2">
      {docs.map((doc, index) => {
        const cls =
          doc === "verified" ? "text-green-600" :
          doc === "flagged" ? "text-red-600" : "text-gray-300";
        return doc === "flagged" ? (
          <XCircle key={index} className={cn("h-4 w-4", cls)} />
        ) : (
          <CheckCircle2 key={index} className={cn("h-4 w-4", cls)} />
        );
      })}
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon,
  tone,
}: {
  label: string;
  value: number;
  note: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="flex min-h-[134px] items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="mt-2 text-3xl font-bold leading-none text-gray-900">{value}</p>
        <p className={cn("mt-4 text-sm font-medium", tone)}>{note}</p>
      </div>
      {icon}
    </div>
  );
}

/* ─── Simulated Document Scan Preview Component ──────────────────── */
function DocumentScanPreview({
  request,
  tab,
}: {
  request: KycRequest;
  tab: "front" | "back" | "selfie";
}) {
  if (request.rawImages) {
    if (tab === "selfie") {
      return (
        <div className="flex items-center justify-center w-full h-full p-2">
          <img src={request.rawImages.selfie} alt="Selfie" className="max-h-[400px] max-w-[100%] rounded-xl object-contain shadow-md border border-gray-200" />
        </div>
      );
    } else if (tab === "front") {
      return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full h-full p-2 overflow-y-auto">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-gray-600">FRONT</span>
            <img src={request.rawImages.front} alt="Front ID" className="max-h-[300px] max-w-[100%] rounded-xl object-contain shadow-md border border-gray-200" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-gray-600">BACK</span>
            <img src={request.rawImages.back} alt="Back ID" className="max-h-[300px] max-w-[100%] rounded-xl object-contain shadow-md border border-gray-200" />
          </div>
        </div>
      );
    }
  }

  const user = request.user;
  const isPassport = request.documentType === "Passport";

  if (tab === "selfie") {
    const matchPercent = user.risk === "High Risk" ? "61.4%" : "98.2%";
    const isMatched = user.risk !== "High Risk";
    return (
      <div className="flex flex-col items-center justify-center p-2 min-h-[220px] w-full">
        <div className="flex items-center gap-8 justify-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-24 w-20 rounded-lg bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 overflow-hidden relative">
              <User className="h-12 w-12 text-gray-600" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-center text-white py-0.5 font-bold uppercase tracking-wider font-mono">ID Photo</div>
            </div>
            <span className="text-[9px] font-bold text-gray-600 uppercase font-mono">Document</span>
          </div>

          <div className="flex flex-col items-center justify-center gap-1 shrink-0">
            <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm", isMatched ? "bg-green-500" : "bg-red-500")}>
              {isMatched ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            </div>
            <span className={cn("text-[11px] font-black tracking-tight font-mono", isMatched ? "text-green-600" : "text-red-600")}>
              {matchPercent} Match
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="h-24 w-20 rounded-lg bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 overflow-hidden relative">
              <User className="h-12 w-12 text-gray-600" />
              <div className="absolute bottom-0 left-0 right-0 bg-[#0A3D91]/80 text-[8px] text-center text-white py-0.5 font-bold uppercase tracking-wider font-mono">Selfie</div>
            </div>
            <span className="text-[9px] font-bold text-gray-600 uppercase font-mono">Live Selfie</span>
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold text-gray-600 text-center max-w-sm">
          {isMatched
            ? "Biometric facial comparison matches document identity information."
            : "Verification warning: biometric similarity falls significantly below safety thresholds."}
        </p>
      </div>
    );
  }

  if (isPassport) {
    if (tab === "back") {
      return (
        <div className="flex flex-col items-center justify-center p-4 min-h-[220px] text-center w-full">
          <FileText className="h-12 w-12 text-gray-300 mb-2" />
          <h4 className="font-semibold text-gray-700 text-sm">Passport Signature Page</h4>
          <p className="text-xs text-gray-600 max-w-xs mt-1">Canadian passports utilize a single primary biographical page. Use bio page preview and selfie verification metrics.</p>
        </div>
      );
    }
    return (
      <div className="relative w-full max-w-[420px] mx-auto rounded-2xl border border-slate-800 bg-slate-900 text-white p-4 shadow-lg overflow-hidden font-mono text-[9px] min-h-[210px] flex flex-col justify-between">
        <div className="flex justify-between items-start border-b border-slate-700 pb-1.5 mb-2">
          <div>
            <h4 className="font-bold text-[8px] uppercase tracking-wider text-slate-300">PASSPORT / PASSEPORT</h4>
            <p className="text-[6px] text-slate-400">CANADA</p>
          </div>
          <div className="h-4 w-7 bg-amber-500/10 rounded border border-amber-500/30 flex items-center justify-center text-[6px] text-amber-400 font-bold">CAN</div>
        </div>

        <div className="flex gap-3 items-center">
          <div className="flex flex-col gap-1 items-center">
            <div className="h-16 w-14 bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-slate-500 relative">
              <User className="h-8 w-8 text-slate-400" />
            </div>
            <span className="text-[5px] tracking-wider text-slate-500">P&lt;CAN&lt;{user.id.replace("-", "")}</span>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-300 text-[8px]">
            <div>
              <span className="text-slate-500 block text-[5px] uppercase font-bold leading-none">Surname / Nom</span>
              <span className="font-bold uppercase text-white">{user.name.split(" ")[1] || user.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[5px] uppercase font-bold leading-none">Passport No. / No. du passeport</span>
              <span className="font-bold text-white">PA-{user.id.slice(-5)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[5px] uppercase font-bold leading-none">Given Names / Prénoms</span>
              <span className="font-bold uppercase text-white">{user.name.split(" ")[0]}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[5px] uppercase font-bold leading-none">Nationality / Nationalité</span>
              <span className="font-bold uppercase text-white">Canadian</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[5px] uppercase font-bold leading-none">Date of Birth / Date de naissance</span>
              <span className="font-bold text-white">{user.dateOfBirth}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[5px] uppercase font-bold leading-none">Sex / Sexe</span>
              <span className="font-bold text-white">{user.name === "Emma Thompson" || user.name === "Sophie Anderson" ? "F" : "M"}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[5px] uppercase font-bold leading-none">Issue Date</span>
              <span className="font-bold text-white">08 Nov 2016</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[5px] uppercase font-bold leading-none">Expiry Date</span>
              <span className={cn("font-bold", user.risk === "High Risk" ? "text-red-400 font-extrabold" : "text-white")}>
                08 Nov 2026 {user.risk === "High Risk" && "(EXPIRED)"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2 border-t border-slate-800 pt-1.5 text-[6px] font-bold text-slate-500 leading-none">
          P&lt;CAN{user.name.split(" ")[1]?.toUpperCase() || "SMITH"}&lt;&lt;{user.name.split(" ")[0]?.toUpperCase() || "JOHN"}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br />
          PA1234567&lt;8CAN9206145M2611081&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;0
        </div>
      </div>
    );
  }

  // Driver's License
  const isFront = tab === "front";
  if (!isFront) {
    return (
      <div className="relative w-full max-w-[420px] mx-auto h-[210px] rounded-2xl border border-gray-300 bg-gradient-to-br from-gray-50 to-slate-100 text-gray-800 p-4 shadow-md flex flex-col justify-between font-mono text-[8px]">
        <div className="w-full h-7 bg-slate-800 -mx-4 -mt-4 rounded-t-xl" />

        <div className="flex gap-4 mt-2 items-center flex-1">
          <div className="w-12 h-24 bg-slate-900 border border-slate-900 flex flex-col gap-0.5 justify-around py-2 px-1 rounded shrink-0">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="h-0.5 bg-white" style={{ opacity: Math.random() > 0.35 ? 1 : 0 }} />
            ))}
          </div>
          <div className="flex-1 space-y-1 text-gray-600 text-[7px] leading-tight">
            <p>1. THIS CARD IS THE PROPERTY OF THE PROVINCIAL JURISDICTION ISSUER.</p>
            <p>2. ALTERATION OF THE DETAILS PRINTED HEREIN IS A PENAL OFFENSE.</p>
            <p>3. CLASS 5 PERMIT AUTHORIZES REGULAR MOTOR VEHICLE ROAD OPERATION.</p>
            <div className="h-px bg-gray-200 my-1" />
            <p className="font-bold text-gray-700 uppercase">DOCUMENT ID: CAN-DL-{user.id.replace("-", "")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Driver's License Front
  return (
    <div className="relative w-full max-w-[420px] mx-auto h-[210px] rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/40 to-white text-gray-800 p-4 shadow-md overflow-hidden flex flex-col justify-between font-mono text-[8px] border-b-4 border-b-sky-600">
      <div className="flex justify-between items-start border-b border-sky-100 pb-1">
        <div>
          <h4 className="font-black text-sky-800 tracking-wider text-[9px] uppercase leading-none">DRIVER'S LICENSE / PERMIS DE CONDUIRE</h4>
          <p className="text-[6px] text-sky-600 font-bold uppercase mt-0.5">CANADA - {user.city.split(",")[1]?.trim() || "QC"}</p>
        </div>
        <span className="text-[10px] font-black text-sky-700">CAN</span>
      </div>

      <div className="flex gap-3 my-2 flex-1 items-center">
        <div className="h-16 w-14 bg-slate-100 rounded border border-slate-300 flex items-center justify-center text-slate-400 shrink-0 relative overflow-hidden">
          <User className="h-8 w-8 text-gray-300" />
          <div className="absolute inset-0 bg-sky-500/5 mix-blend-overlay" />
        </div>

        <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-gray-600 text-[8px]">
          <div>
            <span className="text-sky-700 block text-[5px] font-extrabold uppercase leading-none">1. Surname</span>
            <span className="font-bold uppercase text-gray-800">{user.name.split(" ")[1] || user.name}</span>
          </div>
          <div>
            <span className="text-sky-700 block text-[5px] font-extrabold uppercase leading-none">4d. License No.</span>
            <span className="font-bold text-gray-800">DL-{user.id.slice(-5)}</span>
          </div>
          <div>
            <span className="text-sky-700 block text-[5px] font-extrabold uppercase leading-none">2. Given Names</span>
            <span className="font-bold uppercase text-gray-800">{user.name.split(" ")[0]}</span>
          </div>
          <div>
            <span className="text-sky-700 block text-[5px] font-extrabold uppercase leading-none">8. Address</span>
            <span className="font-bold text-gray-800 text-[6px] leading-none uppercase block truncate max-w-[125px]">{user.street}</span>
            <span className="font-bold text-gray-800 text-[6px] leading-none uppercase block truncate max-w-[125px]">{user.city}</span>
          </div>
          <div>
            <span className="text-sky-700 block text-[5px] font-extrabold uppercase leading-none">3. Date of Birth</span>
            <span className="font-bold text-gray-800">{user.dateOfBirth}</span>
          </div>
          <div>
            <span className="text-sky-700 block text-[5px] font-extrabold uppercase leading-none">9. Class</span>
            <span className="font-bold text-gray-800">5</span>
          </div>
          <div>
            <span className="text-sky-700 block text-[5px] font-extrabold uppercase leading-none">4a. Issue Date</span>
            <span className="font-bold text-gray-800">28 May 2024</span>
          </div>
          <div>
            <span className="text-sky-700 block text-[5px] font-extrabold uppercase leading-none">4b. Expiry Date</span>
            <span className="font-bold text-gray-800">28 May 2029</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-[6px] font-semibold text-gray-600 mt-1 border-t border-sky-50 pt-1">
        <span>CONFIDENTIAL REVIEW ENCRYPTED</span>
        <span className="text-sky-700 font-bold">SECURE TRUST</span>
      </div>
    </div>
  );
}

export default function KycVerificationPage() {
  return (
    <RequirePermission permission={["review-kyc", "view-docs"]}>
      <KycVerificationPageContent />
    </RequirePermission>
  );
}

function KycVerificationPageContent() {
  const router = useRouter();
  const [requests, setRequests] = useState<KycRequest[]>(INITIAL_REQUESTS);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/kyc", { cache: "no-store" });
        if (res.ok) {
          const { submissions } = await res.json();
          if (submissions && submissions.length > 0) {
            const mapped: KycRequest[] = submissions.map((item: any) => {
              const statusMap: any = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
              const fullReqId = item.id?.toString() || item.user_id;
              const fullUserId = item.user_id;
              return {
                requestId: fullReqId.slice(0, 8).toUpperCase(),
                fullRequestId: fullReqId,
                user: {
                  id: fullUserId.slice(0, 8).toUpperCase(),
                  fullUserId: fullUserId,
                  name: item.full_name,
                  email: `${item.full_name.split(' ').join('.').toLowerCase()}@email.com`,
                  phone: "N/A",
                  country: item.country,
                  risk: "Low Risk",
                  dateOfBirth: item.date_of_birth,
                  street: item.street_address,
                  city: item.city,
                  gender: item.gender || "Male",
                },
                documentType: "Government ID",
                documents: ["verified", "verified", "verified"],
                status: statusMap[item.status] || "Pending",
                submitted: item.submitted_at ? new Date(item.submitted_at).toLocaleString() : "Recently",
                rawImages: { front: item.id_front_url, back: item.id_back_url, selfie: item.selfie_url }
              };
            });
            setRequests(mapped);
          } else {
            setRequests([]); // If empty array from DB, clear initial static data
          }
        }
      } catch (err) {
        console.error("KYC fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  /* ─── Modal state variables ─────────────────────────────────────── */
  const [selectedRequest, setSelectedRequest] = useState<KycRequest | null>(null);
  const [previewDoc, setPreviewDoc] = useState<"id" | "selfie" | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const counts = useMemo(() => {
    return {
      all: requests.length,
      Pending: requests.filter((r) => r.status === "Pending").length,
      "Under Review": requests.filter((r) => r.status === "Under Review").length,
      Approved: requests.filter((r) => r.status === "Approved").length,
      Rejected: requests.filter((r) => r.status === "Rejected").length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesTab = activeTab === "all" || request.status === activeTab;
      const matchesSearch =
        !query ||
        request.requestId.toLowerCase().includes(query) ||
        request.user.id.toLowerCase().includes(query) ||
        request.user.name.toLowerCase().includes(query) ||
        request.user.email.toLowerCase().includes(query) ||
        request.documentType.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, requests, search]);

  const stats = [
    {
      label: "Pending Review",
      value: counts.Pending,
      note: "Requires attention",
      tone: "text-amber-600",
      icon: (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Clock className="h-6 w-6" />
        </div>
      ),
    },
    {
      label: "Under Review",
      value: counts["Under Review"],
      note: "In progress",
      tone: "text-blue-700",
      icon: (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Eye className="h-6 w-6" />
        </div>
      ),
    },
    {
      label: "Approved Today",
      value: requests.filter((r) => r.status === "Approved").length,
      note: "From current session",
      tone: "text-green-600",
      icon: (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
      ),
    },
    {
      label: "High Risk",
      value: requests.filter((r) => r.user.risk === "High Risk" && r.status !== "Approved").length,
      note: "Review carefully",
      tone: "text-red-600",
      icon: (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
      ),
    },
  ];

  /* ─── Modal Handlers ─────────────────────────────────────────────── */
  const handleStartReview = (req: KycRequest) => {
    setSelectedRequest(req);
    setPreviewDoc(null);
    setShowApproveModal(false);
    setShowRejectModal(false);
    setRejectionReason("");

    // Automatically transition to 'Under Review' when viewed if 'Pending'
    if (req.status === "Pending") {
      setRequests((current) =>
        current.map((r) =>
          r.requestId === req.requestId ? { ...r, status: "Under Review" } : r
        )
      );
      setToast(`Request ${req.requestId} status updated to Under Review.`);
      window.setTimeout(() => setToast(null), 2500);
    }
  };

  const handleCloseReviewModal = () => {
    setSelectedRequest(null);
  };

  const handleConfirmApprove = async () => {
    if (!selectedRequest) return;
    const reqId = selectedRequest.requestId;
    const fullUserId = (selectedRequest.user as any).fullUserId || selectedRequest.user.id;
    
    await fetch("/api/kyc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: fullUserId, status: "approved" }),
    });

    setRequests((current) =>
      current.map((r) => (r.requestId === reqId ? { ...r, status: "Approved" } : r))
    );
    setSelectedRequest(null);
    setShowApproveModal(false);
    setToast(`KYC verification for ${selectedRequest.user.name} approved successfully ✓`);
    window.setTimeout(() => setToast(null), 2600);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;
    const reqId = selectedRequest.requestId;
    const fullUserId = (selectedRequest.user as any).fullUserId || selectedRequest.user.id;

    await fetch("/api/kyc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: fullUserId, status: "rejected", rejectionReason }),
    });

    setRequests((current) =>
      current.map((r) => (r.requestId === reqId ? { ...r, status: "Rejected" } : r))
    );
    setSelectedRequest(null);
    setShowRejectModal(false);
    setToast(`KYC Request ${reqId} rejected: ${rejectionReason}`);
    window.setTimeout(() => setToast(null), 2600);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[26px] font-bold leading-tight text-gray-900 sm:text-[30px]">KYC Verification Center</h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">Review and approve user identity verification documents</p>
          </div>
          <button
            onClick={() => {
              setToast("KYC report export prepared.");
              window.setTimeout(() => setToast(null), 2500);
            }}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <MetricCard key={stat.label} {...stat} />
          ))}
        </div>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, request ID, or document..."
                className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-11 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-500 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 sm:text-base"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto border-b border-gray-200 px-4 no-scrollbar">
            {TABS.map((tab) => {
              const active = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "relative flex h-14 shrink-0 items-center gap-2 px-2 text-sm font-semibold transition-colors sm:px-4 cursor-pointer",
                    active ? "text-blue-700" : "text-gray-600 hover:text-gray-800"
                  )}
                >
                  {tab.label}
                  <span className={cn("rounded-full px-2 py-0.5 text-xs", active ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600")}>
                    {counts[tab.value]}
                  </span>
                  {active && <motion.span layoutId="kyc-tab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-blue-700" />}
                </button>
              );
            })}
          </div>

          {/* Table Container with scroll styling */}
          <div className="overflow-x-auto">
            {/* Table headers */}
            <div className="grid min-w-[1150px] grid-cols-[1.1fr_1.7fr_1.3fr_1fr_1.1fr_1fr_1.6fr_120px] gap-4 bg-gray-50 px-5 py-3 border-b border-gray-200/80">
              {["REQUEST", "USER", "DOCUMENT TYPE", "DOCUMENTS", "STATUS", "RISK", "SUBMITTED", "ACTIONS"].map((heading) => (
                <span key={heading} className="text-[11px] font-bold uppercase tracking-wider text-gray-600">{heading}</span>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-[1150px] divide-y divide-gray-100 bg-white"
                >
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="grid grid-cols-[1.1fr_1.7fr_1.3fr_1fr_1.1fr_1fr_1.6fr_120px] gap-4 items-center px-5 py-4.5 border-b border-gray-50">
                      <div className="h-4 bg-gray-100 rounded-lg w-16 animate-pulse" />
                      <div className="space-y-1.5">
                        <div className="h-4 bg-gray-100 rounded-lg w-28 animate-pulse" />
                        <div className="h-3 bg-gray-100 rounded-lg w-36 animate-pulse" />
                      </div>
                      <div className="h-4 bg-gray-100 rounded-lg w-24 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded-lg w-16 animate-pulse" />
                      <div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse" />
                      <div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded-lg w-28 animate-pulse" />
                      <div className="h-8 bg-gray-100 rounded-lg w-full animate-pulse" />
                    </div>
                  ))}
                </motion.div>
              ) : filteredRequests.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-w-[1150px] py-16 text-center text-sm font-medium text-gray-600 bg-white"
                >
                  No KYC requests found.
                </motion.div>
              ) : (
                <motion.div key={`${activeTab}-${search}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {filteredRequests.map((request) => (
                    <div
                      key={request.requestId}
                      className="grid min-w-[1150px] grid-cols-[1.1fr_1.7fr_1.3fr_1fr_1.1fr_1fr_1.6fr_120px] items-center gap-4 border-b border-gray-100 bg-white px-5 py-4 transition-colors hover:bg-blue-50/20"
                    >
                      <div>
                        <p className="font-bold text-gray-900">{request.requestId}</p>
                        <p className="text-xs text-gray-600">{request.user.id}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{request.user.name}</p>
                        <p className="truncate text-xs text-gray-600">{request.user.email}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="h-4 w-4 text-gray-600" />
                        {request.documentType}
                      </div>
                      <DocumentDots docs={request.documents} />
                      <div>
                        <StatusBadge status={request.status} />
                      </div>
                      <div>
                        <RiskBadge level={request.user.risk} />
                      </div>
                      <div className="text-xs font-semibold text-gray-600">
                        {request.submitted}
                      </div>
                      <div className="relative flex justify-end">
                        <button
                          onClick={() => handleStartReview(request)}
                          className="inline-flex h-8.5 w-full items-center justify-center gap-1.5 rounded-lg bg-[#0A3D91] px-3 text-xs font-bold text-white transition-all hover:bg-[#1650AB] active:scale-[0.98] shadow-sm cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/60 px-5 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing <strong className="text-gray-700">{filteredRequests.length}</strong> of <strong className="text-gray-700">{requests.length}</strong> verification requests
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <ShieldCheck className="h-4 w-4 text-[#0A3D91]" />
              CDNT secure identity queue
            </div>
          </div>
        </section>
      </motion.div>

      {/* ─── MODALS STACK ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={handleCloseReviewModal}
            />

            {/* SCREEN 1: Centered KYC Review Modal */}
            {(!previewDoc && !showApproveModal && !showRejectModal) && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 border border-gray-100"
              >
                {/* Close Button */}
                <button
                  onClick={handleCloseReviewModal}
                  className="absolute right-6 top-6 h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="px-8 pt-7 pb-4">
                  <h2 className="text-[22px] font-bold text-gray-900 leading-tight">KYC Review</h2>
                  <p className="text-[11px] text-gray-600 font-semibold mt-1">
                    {selectedRequest.requestId} • Submitted {selectedRequest.submitted}
                  </p>
                  
                  {/* Badges */}
                  <div className="flex gap-2.5 mt-3">
                    <StatusBadge status={selectedRequest.status} />
                    <span className="inline-flex items-center bg-green-50 text-green-600 border border-green-100 px-3 py-1 rounded-full text-xs font-semibold">
                      {selectedRequest.user.risk}
                    </span>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="px-8 pb-8 flex-1 overflow-y-auto space-y-6">
                  {/* User Information Box */}
                  <div>
                    <h3 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider mb-2.5">
                      User Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 bg-gray-50/60 border border-gray-100/60 rounded-2xl p-5">
                      {[
                        { label: "Full Name", value: selectedRequest.user.name, icon: User },
                        { label: "Email", value: selectedRequest.user.email, icon: Mail },
                        { label: "Phone", value: selectedRequest.user.phone, icon: Phone },
                        { label: "Gender", value: selectedRequest.user.gender, icon: User },
                        { label: "Country", value: selectedRequest.user.country, icon: MapPin },
                      ].map((field, idx) => {
                        const Icon = field.icon;
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-white border border-gray-150/60 flex items-center justify-center text-gray-600 shrink-0 shadow-sm">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider leading-none">
                                {field.label}
                              </p>
                              <p className="text-sm font-semibold text-gray-900 mt-1 truncate">
                                {field.value}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submitted Documents Box */}
                  <div>
                    <h3 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider mb-2.5">
                      Submitted Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Card 1: ID Document */}
                      <div
                        onClick={() => setPreviewDoc("id")}
                        className="border border-gray-200/80 rounded-2xl p-5 hover:border-blue-400 transition-colors cursor-pointer bg-white group flex flex-col justify-between min-h-[200px]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-700">
                            <CreditCard className="h-4.5 w-4.5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                            <span className="text-sm font-bold">{selectedRequest.documentType}</span>
                          </div>
                          <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            Uploaded
                          </span>
                        </div>
                        <div className="mt-4 h-32 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-600 font-semibold text-xs group-hover:bg-gray-100/60 transition-colors">
                          <CreditCard className="h-6 w-6 stroke-[1.5]" />
                          <span>Click to view</span>
                        </div>
                      </div>

                      {/* Card 2: Selfie Document */}
                      <div
                        onClick={() => setPreviewDoc("selfie")}
                        className="border border-gray-200/80 rounded-2xl p-5 hover:border-blue-400 transition-colors cursor-pointer bg-white group flex flex-col justify-between min-h-[200px]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-700">
                            <UserCheck className="h-4.5 w-4.5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                            <span className="text-sm font-bold">Selfie Verification</span>
                          </div>
                          <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            Uploaded
                          </span>
                        </div>
                        <div className="mt-4 h-32 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-600 font-semibold text-xs group-hover:bg-gray-100/60 transition-colors">
                          <User className="h-6 w-6 stroke-[1.5]" />
                          <span>Click to view</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer inside the modal */}
                  {selectedRequest.status === "Approved" || selectedRequest.status === "Rejected" ? (
                    <div className="flex justify-center pt-5 border-t border-gray-100">
                      <button
                        onClick={handleCloseReviewModal}
                        className="px-6 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3 justify-end pt-5 border-t border-gray-100">
                      <button
                        onClick={() => setShowRejectModal(true)}
                        className="px-6 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-700 text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        Reject KYC
                      </button>
                      <button
                        onClick={() => setShowApproveModal(true)}
                        className="px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5 hover:opacity-90 cursor-pointer"
                        style={{ background: BRAND_GRADIENT }}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Approve KYC
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* SCREEN 2: Centered ID Document Preview Modal */}
            {previewDoc && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 340 }}
                className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col z-20 border border-gray-100 p-6"
              >
                {/* Close button in top-right */}
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="absolute right-6 top-6 h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="mb-4">
                  <h3 className="text-base font-bold text-gray-900">
                    {previewDoc === "id"
                      ? `${selectedRequest.documentType} Scan Preview`
                      : "Selfie Verification Biometrics"}
                  </h3>
                  <p className="text-xs text-gray-600 font-medium">
                    Review and match details against registered user profile.
                  </p>
                </div>

                {/* Preview Frame */}
                <div className="p-6 bg-slate-50 border border-gray-200/80 rounded-2xl flex flex-col items-center justify-center min-h-[260px] w-full">
                  <DocumentScanPreview request={selectedRequest} tab={previewDoc === "id" ? "front" : "selfie"} />
                </div>

                {/* Subtext and Actions */}
                <div className="mt-5 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
                    <ZoomIn className="h-4 w-4 text-gray-600 shrink-0" />
                    <span>ID Document Preview Mode</span>
                  </div>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="px-5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Back to Review
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 3: Centered Reject KYC Modal */}
            {showRejectModal && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 350 }}
                className="relative bg-white w-full max-w-[420px] rounded-2xl shadow-2xl p-6 z-20 border border-gray-100"
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="absolute right-6 top-6 h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Warning Icon Header */}
                <div className="h-11 w-11 rounded-full bg-red-50 border border-red-100 text-red-500 flex items-center justify-center mb-4">
                  <XCircle className="h-6 w-6" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 leading-tight">Reject KYC</h3>
                <p className="text-xs text-gray-600 mt-1 font-semibold">Deny verification request</p>

                {/* Reason Field */}
                <div className="mt-5 space-y-1.5">
                  <label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest block">
                    Rejection Reason *
                  </label>
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this KYC verification is being rejected..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/40 text-sm outline-none resize-none focus:border-red-400 focus:ring-2 focus:ring-red-50 min-h-[100px] text-gray-800 placeholder:text-gray-500 font-medium transition-all"
                  />
                  <p className="text-[11px] text-gray-600">
                    This reason will be sent to the user
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-bold text-gray-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReject}
                    disabled={!rejectionReason.trim()}
                    className="flex-1 py-2.5 rounded-xl text-white bg-red-600 hover:bg-red-700 text-sm font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Reject KYC
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 4: Centered Approve KYC Modal */}
            {showApproveModal && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 350 }}
                className="relative bg-white w-full max-w-[420px] rounded-2xl shadow-2xl p-6 z-20 border border-gray-100"
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="absolute right-6 top-6 h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Check Icon Header */}
                <div className="h-11 w-11 rounded-full bg-green-50 border border-green-100 text-green-500 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 leading-tight">Approve KYC</h3>
                <p className="text-xs text-gray-600 mt-1 font-semibold">Verify user identity</p>

                {/* Confirmation Body */}
                <p className="text-xs text-gray-600 leading-relaxed mt-4 font-semibold">
                  Are you sure you want to approve KYC verification for{" "}
                  <strong className="text-gray-900 font-extrabold">{selectedRequest.user.name}</strong>?
                  This will grant them full account access and increase their transaction limits.
                </p>

                {/* Footer Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowApproveModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-bold text-gray-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmApprove}
                    className="flex-1 py-2.5 rounded-xl text-white bg-green-600 hover:bg-green-700 text-sm font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Approve KYC
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-xl border border-slate-800"
          >
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            <span className="truncate">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
