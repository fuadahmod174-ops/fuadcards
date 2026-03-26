import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title = "FuadCards - AI Anime Trading Cards", 
  description = "Generate, collect, and trade high-end AI-powered anime cards. Created by Fuad Ahmed.",
  image = "https://picsum.photos/seed/fuadcards/1200/630",
  url = window.location.href
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="fuadcards, fuadahmed, fuadeditingzone, fuad anime, anime website, trading cards, AI anime" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      <link rel="canonical" href={url} />
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "FuadCards",
          "url": "https://fuadcards.com",
          "potentialAction": [
            {
              "@type": "SearchAction",
              "target": "https://fuadcards.com/generate",
              "query-input": "required name=search_term_string",
              "name": "Generate Card"
            },
            {
              "@type": "ViewAction",
              "target": "https://fuadcards.com/login",
              "name": "Log In"
            },
            {
              "@type": "ViewAction",
              "target": "https://fuadcards.com/signup",
              "name": "Sign Up"
            }
          ]
        })}
      </script>
    </Helmet>
  );
};
