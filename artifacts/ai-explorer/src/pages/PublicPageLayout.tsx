import { useEffect, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import "./public-pages.css";

type PublicPageLayoutProps = {
  eyebrow: string;
  title: string;
  metaDescription: string;
  children: ReactNode;
};

export function PublicPageLayout({ eyebrow, title, metaDescription, children }: PublicPageLayoutProps) {
  useEffect(() => {
    const previousTitle = document.title;
    const existingDescription = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = existingDescription?.content;
    const description = existingDescription ?? document.createElement("meta");
    if (!existingDescription) {
      description.name = "description";
      document.head.appendChild(description);
    }
    document.title = title;
    description.content = metaDescription;
    return () => {
      document.title = previousTitle;
      if (existingDescription) description.content = previousDescription ?? "";
      else description.remove();
    };
  }, [metaDescription, title]);

  return (
    <main className="page-content public-page">
      <Link href="/" className="back-link"><ArrowLeft size={15} /> Back to Learn Think Build</Link>
      <header className="public-page-header">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
      </header>
      <div className="public-page-body">{children}</div>
    </main>
  );
}
