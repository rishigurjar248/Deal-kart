<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>DealKart Sitemap</title>
        <style>
          body { margin: 0; color: #202a32; background: #f3f6f7; font: 16px/1.5 "Segoe UI", sans-serif; }
          main { max-width: 900px; margin: 48px auto; padding: 0 20px; }
          h1 { margin: 0 0 8px; font-size: 28px; }
          p { margin: 0 0 24px; color: #52616b; }
          table { width: 100%; border-collapse: collapse; background: #fff; }
          th, td { padding: 12px 14px; border-bottom: 1px solid #dce3e6; text-align: left; }
          th { color: #35434c; background: #e8eef0; }
          a { color: #087c70; overflow-wrap: anywhere; }
          @media (max-width: 560px) { main { margin: 28px auto; } th, td { padding: 10px 8px; font-size: 14px; } }
        </style>
      </head>
      <body>
        <main>
          <h1>DealKart Sitemap</h1>
          <p><xsl:value-of select="count(s:urlset/s:url)"/> URLs</p>
          <table>
            <thead>
              <tr><th>URL</th><th>Last modified</th><th>Change frequency</th><th>Priority</th></tr>
            </thead>
            <tbody>
              <xsl:for-each select="s:urlset/s:url">
                <tr>
                  <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                  <td><xsl:value-of select="s:lastmod"/></td>
                  <td><xsl:value-of select="s:changefreq"/></td>
                  <td><xsl:value-of select="s:priority"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>