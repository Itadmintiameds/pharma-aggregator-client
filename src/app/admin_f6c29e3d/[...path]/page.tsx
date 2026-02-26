"use client";

import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import AdminLogin from "../components/AdminLogin";
import RequestDetails from "../components/RequestDetails";

export default function AdminSegmentPage() {
  const params = useParams();
  const path = params?.path as string[];
  const segment = path?.[0];
  const subSegment = path?.[1];

  if (segment === "login") {
    return <AdminLogin />;
  }

  if (segment === "requests" && subSegment) {
    return <RequestDetails requestId={subSegment} />;
  }

  notFound();
}