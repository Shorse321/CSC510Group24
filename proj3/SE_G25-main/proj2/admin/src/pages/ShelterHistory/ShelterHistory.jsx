import React, { useEffect, useMemo, useState } from "react";
import "./ShelterHistory.css";
import axios from "axios";
import { toast } from "react-toastify";
import { url, currency } from "../../assets/assets";
import ShelterHistoryMapModal from "./ShelterHistoryMapModal";

const ShelterHistory = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedRerouteForMap, setSelectedRerouteForMap] = useState(null); // NEW: For map modal

  // pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  // quick text filter (client-side)
  const [q, setQ] = useState("");

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    setErr("");
    try {
      const res = await axios.get(`${url}/api/reroutes`, {
        params: { page: p, limit },
      });
      if (res.data?.success) {
        setRows(res.data.data || []);
        setTotal(res.data.total || 0);
        setPage(res.data.page || p);
      } else {
        const msg = res.data?.message || "Failed to fetch shelter history";
        setErr(msg);
        toast.error(msg);
      }
    } catch (e) {
      setErr("Network error while fetching shelter history");
      toast.error("Network error while fetching shelter history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageCount = Math.max(1, Math.ceil(total / limit));

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => {
      const orderTxt = (r.order?.orderNumber || r.orderId || "")
        .toString()
        .toLowerCase();
      const shelterTxt = (r.shelter?.name || r.shelterName || "").toLowerCase();
      return (
        orderTxt.includes(needle) ||
        shelterTxt.includes(needle)
      );
    });
  }, [rows, q]);

  const fmt = (d) => (d ? new Date(d).toLocaleString() : "—");
const canShowMap = (reroute) => {
  const lat =
    reroute?.shelterAddress?.lat;

  const lng =
    reroute?.shelterAddress?.lng;

  return typeof lat === "number" && typeof lng === "number";
};

  /**
   * Handle show map button click
   */
  const handleShowMap = async (reroute) => {
    if (!canShowMap(reroute)) {
      toast.warning("This record doesn't have complete location data.");
      return;
    }

    // Fetch the full order details to get the original address
    try {
      const response = await axios.get(`${url}/api/order/list`);
      if (response.data.success) {
       const order = response.data.data.find(
  (o) => o._id?.toString() === reroute.orderId?.toString()
);
        if (order) {
          setSelectedRerouteForMap({
            ...reroute,
            orderDetails: order // Include full order details
          });
        } else {
          toast.warning("Order details not found.");
        }
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details for map.");
    }
  };

  return (
    <div className="shelter-history-page">
      <div className="sh-header">
        <h3 style={{marginTop: "40px"}}>Shelter Redistribution History</h3>
        <div className="sh-tools">
          <input style={{marginTop: "40px"}}
            className="sh-search"
            placeholder="Filter by order / shelter"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <a className="sh-link" href="/shelters" style={{marginTop: "40px"}}>
            Back to Shelters
          </a>
        </div>
      </div>

      {loading && <p className="sh-status">Loading…</p>}
      {!loading && err && <p className="sh-error">Error: {err}</p>}

      {!loading && !err && (
        <>
          <div className="sh-card" style={{marginTop: "40px"}}>
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Order ID</th>
                    <th>Shelter</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Map</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="sh-status">
                        No redistribution records yet.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={r._id} title={fmt(r.createdAt)}>
                        <td className="muted">{fmt(r.createdAt)}</td>

                        {/* monospace id with truncation + tooltip */}
                        <td
                          className="mono ellipsis"
                          title={r.order?.orderNumber || r.orderId}
                        >
                          {r.orderId?.slice(-8) || r.order?.orderNumber}
                        </td>

                        {/* Shelter name and contact */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <strong 
                              className="ellipsis" 
                              title={r.shelter?.name || r.shelterName || "—"}
                              style={{ color: "var(--sh-accent-strong)" }}
                            >
                              {r.shelter?.name || r.shelterName || "—"}
                            </strong>
                            {r.shelterContactEmail && (
                              <small className="muted" style={{ fontSize: "11px" }}>
                                📧 {r.shelterContactEmail}
                              </small>
                            )}
                            {r.shelterContactPhone && (
                              <small className="muted" style={{ fontSize: "11px" }}>
                                📞 {r.shelterContactPhone}
                              </small>
                            )}
                          </div>
                        </td>

                        {/* items as chips */}
                        <td>
                          <div className="chips">
                            {(r.items || []).map((it, i) => (
                              <span
                                key={i}
                                className="chip"
                                title={`${it.name} × ${it.qty}`}
                              >
                                {it.name} <strong>× {it.qty}</strong>
                              </span>
                            ))}
                          </div>
                        </td>

                        <td>
                          {r.total != null ? `${currency}${r.total}` : "—"}
                        </td>
                        {/* Map button */}
                        <td>
                          <button
                            className="sh-map-btn"
                            onClick={() => handleShowMap(r)}
                            disabled={!canShowMap(r)}
                            title={canShowMap(r) ? "View donation journey on map" : "Location data not available"}
                          >
                            🗺️ Map
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pageCount > 1 && (
            <div className="sh-pager">
              <button
                className="btn"
                disabled={page === 1}
                onClick={() => fetchHistory(page - 1)}
              >
                Prev
              </button>
              <span>
                Page {page} of {pageCount}
              </span>
              <button
                className="btn"
                disabled={page === pageCount}
                onClick={() => fetchHistory(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Map Modal */}
      {selectedRerouteForMap && (
        <ShelterHistoryMapModal
          reroute={selectedRerouteForMap}
          onClose={() => setSelectedRerouteForMap(null)}
        />
      )}
    </div>
  );
};

export default ShelterHistory;