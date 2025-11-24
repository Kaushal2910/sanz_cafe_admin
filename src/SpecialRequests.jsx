import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

const SpecialRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredStatus, setFilteredStatus] = useState("all");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const snapshot = await getDocs(collection(db, "custom_requests"));
        const data = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setRequests(data);
      } catch (err) {
        console.error("Error fetching requests:", err);
      }
    };

    fetchRequests();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      // 1. Update Firestore status
      await updateDoc(doc(db, "custom_requests", id), { status: newStatus });

      // 2. Update local state
      setRequests(prev =>
        prev.map(req => req.id === id ? { ...req, status: newStatus } : req)
      );

      // 3. Find the request data for API call
      const requestData = requests.find(req => req.id === id);

      if (requestData) {
        // 4. Call Vercel API to send email
        const response = await fetch(
          "https://sanz-cafe.vercel.app/api/sendEmail",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: requestData.email,
              name: requestData.name,
              status: newStatus,
              date: requestData.date,
              time: requestData.time,
              guests: requestData.guests,
              notes: requestData.notes,
            }),
          }
        );

        const result = await response.json();
        console.log("Email API result:", result);

        // 5. (Optional) Log email in Firestore
        // await setDoc(doc(db, "email_logs", id), {
        //   to: requestData.email,
        //   status: newStatus,
        //   sentAt: serverTimestamp(),
        //   success: result.ok,
        // });
      }
    } catch (err) {
    console.error("Error updating status:", err);
    }
  };

  const filteredRequests =
    filteredStatus === "all"
      ? requests
      : requests.filter(req => req.status === filteredStatus);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6 text-yellow-400 border-b border-gray-700 pb-2">
        Special Requests
      </h2>

      {/* Filter Dropdown */}
      <div className="mb-6 flex justify-start items-center gap-2">
        <label className="text-sm text-gray-300">Filter by status:</label>
        <select
          value={filteredStatus}
          onChange={(e) => setFilteredStatus(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 shadow-md"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map(req => (
          <div
            key={req.id}
            className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 hover:shadow-yellow-500/20 transition duration-300"
          >
            <h3 className="text-yellow-400 font-bold text-xl mb-3">{req.name}</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <p><span className="font-semibold text-white">Email:</span> {req.email}</p>
              <p><span className="font-semibold text-white">Phone:</span> {req.phone}</p>
              <p><span className="font-semibold text-white">Guests:</span> {req.guests}</p>
              <p><span className="font-semibold text-white">Date:</span> {req.date}</p>
              <p><span className="font-semibold text-white">Time:</span> {req.time}</p>
              <p><span className="font-semibold text-white">Notes:</span> {req.notes}</p>
              <p>
                <span className="font-semibold text-white">Status:</span>{" "}
                <span
                  className={`font-bold ${
                    req.status === "pending"
                      ? "text-yellow-400"
                      : req.status === "accepted"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {req.status}
                </span>
              </p>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handleStatusUpdate(req.id, "accepted")}
                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-white font-semibold transition"
              >
                Accept
              </button>
              <button
                onClick={() => handleStatusUpdate(req.id, "rejected")}
                className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-white font-semibold transition"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecialRequests;