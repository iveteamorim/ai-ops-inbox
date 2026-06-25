import Link from "next/link";

type Props = {
  href?: string;
  label: string;
};

export function SettingsBackLink({ href = "/settings", label }: Props) {
  return (
    <Link href={href} className="settings-back-link action-link">
      {label}
    </Link>
  );
}
