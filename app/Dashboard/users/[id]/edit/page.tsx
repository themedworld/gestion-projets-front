"use client";

import EditUserPage from "@/component/edituser";
import { useParams } from "next/navigation";

export default function EditUserPagePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div className="p-10">
      <EditUserPage id={id} />
    </div>
  );
}
