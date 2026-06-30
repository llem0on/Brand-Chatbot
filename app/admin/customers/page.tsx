"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Customer } from "@/lib/types";
import DataTable from "@/components/admin/DataTable";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Customer[]>("/admin/customers")
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink mb-8">Pelanggan</h1>

      <DataTable
        headers={["Kode", "Nama", "Telepon", "Alamat"]}
        loading={loading}
        empty={!loading && customers.length === 0}
      >
        {customers.map((customer) => (
          <tr key={customer.id}>
            <td className="px-5 py-3.5 text-ink/70">{customer.customer_code}</td>
            <td className="px-5 py-3.5 text-ink">{customer.name}</td>
            <td className="px-5 py-3.5 text-ink/70">{customer.phone}</td>
            <td className="px-5 py-3.5 text-ink/60 max-w-xs">{customer.address}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
