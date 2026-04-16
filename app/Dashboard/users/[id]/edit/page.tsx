"use client";
import EditUserPage from "@/component/edituser";
import { useParams } from "next/navigation";

export default function EditUserPagePage() {
  const { id } = useParams(); // récupère le [id] depuis l'URL

  return (
    <div className="p-10">
      <EditUserPage  />
    </div>
  );
}

