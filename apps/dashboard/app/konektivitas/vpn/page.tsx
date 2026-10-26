import { ConnectivityTable } from "@/components/tables/operations";

export default function VpnPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">VPN</h1>
      <ConnectivityTable label="VPN" />
    </div>
  );
}
