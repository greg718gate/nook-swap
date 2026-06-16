import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type DispatchAddressValues = {
  dispatch_name: string;
  dispatch_line1: string;
  dispatch_line2: string;
  dispatch_city: string;
  dispatch_postcode: string;
};

type DispatchAddressFieldsProps = {
  values: DispatchAddressValues;
  onChange: (field: keyof DispatchAddressValues, value: string) => void;
  idPrefix?: string;
};

export const DispatchAddressFields = ({
  values,
  onChange,
  idPrefix = "dispatch",
}: DispatchAddressFieldsProps) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-name`}>Sender name</Label>
      <Input
        id={`${idPrefix}-name`}
        value={values.dispatch_name}
        onChange={(e) => onChange("dispatch_name", e.target.value)}
        placeholder="Your name or shop name"
        required
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-line1`}>Address line 1 *</Label>
      <Input
        id={`${idPrefix}-line1`}
        value={values.dispatch_line1}
        onChange={(e) => onChange("dispatch_line1", e.target.value)}
        placeholder="123 High Street"
        required
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-line2`}>Address line 2</Label>
      <Input
        id={`${idPrefix}-line2`}
        value={values.dispatch_line2}
        onChange={(e) => onChange("dispatch_line2", e.target.value)}
        placeholder="Flat 2 (optional)"
      />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-city`}>City *</Label>
        <Input
          id={`${idPrefix}-city`}
          value={values.dispatch_city}
          onChange={(e) => onChange("dispatch_city", e.target.value)}
          placeholder="London"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-postcode`}>Postcode *</Label>
        <Input
          id={`${idPrefix}-postcode`}
          value={values.dispatch_postcode}
          onChange={(e) => onChange("dispatch_postcode", e.target.value)}
          placeholder="SW1A 1AA"
          required
        />
      </div>
    </div>
  </div>
);

export function validateDispatchAddress(values: DispatchAddressValues): string | null {
  if (!values.dispatch_line1.trim()) return "Address line 1 is required";
  if (!values.dispatch_city.trim()) return "City is required";
  if (!values.dispatch_postcode.trim()) return "Postcode is required";
  if (!/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(values.dispatch_postcode.trim())) {
    return "Enter a valid UK postcode";
  }
  return null;
}
