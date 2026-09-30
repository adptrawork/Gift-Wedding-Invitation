import LuxuryGold from "@/templates/luxury-gold/template";
import RomanticGarden from "@/templates/romantic-garden/template";
import ModernMinimal from "@/templates/modern-minimal/template";
import WeddingGift from "@/templates/wedding-gift/template";
import BirthdayGift from "@/templates/birthday-gift/template";

type TemplateProps = { data: Record<string, unknown> };
type TemplateComponent = React.ComponentType<TemplateProps>;

const REGISTRY: Record<string, TemplateComponent> = {
  "luxury-gold": LuxuryGold as unknown as TemplateComponent,
  "romantic-garden": RomanticGarden as unknown as TemplateComponent,
  "modern-minimal": ModernMinimal as unknown as TemplateComponent,
  "wedding-gift": WeddingGift as unknown as TemplateComponent,
  "birthday-gift": BirthdayGift as unknown as TemplateComponent,
};

export function TemplateRenderer({
  templateSlug,
  data,
}: {
  templateSlug: string;
  data: Record<string, unknown>;
}) {
  const Template = REGISTRY[templateSlug];
  if (!Template) return <div className="p-12 text-center">Template tidak ditemukan.</div>;
  return <Template data={data} />;
}
